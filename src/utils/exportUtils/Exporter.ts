/*
Copyright 2024 New Vector Ltd.
Copyright 2021, 2022 The Matrix.org Foundation C.I.C.

SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE files in the repository root for full details.
*/

import { Direction, type MatrixEvent, type Relations, type Room } from "matrix-js-sdk/src/matrix";
import { type EventType, type MediaEventContent, type RelationType } from "matrix-js-sdk/src/types";
import { saveAs } from "file-saver";
import { logger } from "matrix-js-sdk/src/logger";
import sanitizeFilename from "sanitize-filename";

import { ExportType, type IExportOptions } from "./exportUtils";
import { decryptFile } from "../DecryptFile";
import { mediaFromContent } from "../../customisations/Media";
import { formatFullDateNoDay, formatFullDateNoDayISO } from "../../DateUtils";
import { isVoiceMessage } from "../EventUtils";
import { _t } from "../../languageHandler";
import SdkConfig from "../../SdkConfig";

type BlobFile = {
    name: string;
    blob: Blob;
};

type FileDetails = {
    directory: string;
    name: string;
    date: string;
    extension: string;
    count?: number;
};

export default abstract class Exporter {
    protected files: BlobFile[] = [];
    protected fileNames: Map<string, number> = new Map();
    protected cancelled = false;

    protected constructor(
        protected room: Room,
        protected exportType: ExportType,
        protected exportOptions: IExportOptions,
        protected setProgressText: React.Dispatch<React.SetStateAction<string>>,
    ) {
        if (
            exportOptions.maxSize < 1 * 1024 * 1024 || // Less than 1 MB
            exportOptions.maxSize > 8000 * 1024 * 1024 || // More than 8 GB
            (!!exportOptions.numberOfMessages && exportOptions.numberOfMessages > 10 ** 8) ||
            (exportType === ExportType.LastNMessages && !exportOptions.numberOfMessages)
        ) {
            throw new Error("Invalid export options");
        }
        window.addEventListener("beforeunload", this.onBeforeUnload);
    }

    public get destinationFileName(): string {
        return this.makeFileNameNoExtension(SdkConfig.get().brand) + ".zip";
    }

    protected onBeforeUnload(e: BeforeUnloadEvent): string {
        e.preventDefault();
        return (e.returnValue = _t("export_chat|unload_confirm"));
    }

    protected updateProgress(progress: string, log = true, show = true): void {
        if (log) logger.log(progress);
        if (show) this.setProgressText(progress);
    }

    protected addFile(filePath: string, blob: Blob): void {
        const file = {
            name: filePath,
            blob,
        };
        this.files.push(file);
    }

    protected makeFileNameNoExtension(brand = "matrix"): string {
        // First try to use the real name of the room, then a translated copy of a generic name,
        // then finally hardcoded default to guarantee we'll have a name.
        const safeRoomName = sanitizeFilename(this.room.name ?? _t("common|unnamed_room")).trim() || "Unnamed Room";
        const safeDate = formatFullDateNoDayISO(new Date()).replace(/:/g, "-"); // ISO format automatically removes a lot of stuff for us
        const safeBrand = sanitizeFilename(brand);
        return `${safeBrand} - ${safeRoomName} - Chat Export - ${safeDate}`;
    }

    protected async downloadZIP(): Promise<string | void> {
        const filename = this.destinationFileName;
        const filenameWithoutExt = filename.substring(0, filename.lastIndexOf(".")); // take off the extension
        const { default: JSZip } = await import("jszip");

        const zip = new JSZip();
        // Create a writable stream to the directory
        if (!this.cancelled) this.updateProgress(_t("export_chat|generating_zip"));
        else return this.cleanUp();

        for (const file of this.files) zip.file(filenameWithoutExt + "/" + file.name, file.blob);

        const content = await zip.generateAsync({ type: "blob" });
        saveAs(content, filenameWithoutExt + ".zip");
    }

    protected cleanUp(): string {
        logger.log("Cleaning up...");
        window.removeEventListener("beforeunload", this.onBeforeUnload);
        return "";
    }

    public async cancelExport(): Promise<void> {
        logger.log("Cancelling export...");
        this.cancelled = true;
    }

    protected downloadPlainText(fileName: string, text: string): void {
        const content = new Blob([text], { type: "text/plain" });
        saveAs(content, fileName);
    }

    protected setEventMetadata(event: MatrixEvent): MatrixEvent {
        event.setMetadata(this.room.currentState, false);
        return event;
    }

    public getLimit(): number {
        let limit: number;
        switch (this.exportType) {
            case ExportType.LastNMessages:
                // validated in constructor that numberOfMessages is defined
                // when export type is LastNMessages
                limit = this.exportOptions.numberOfMessages!;
                break;
            default:
                limit = 10 ** 8;
        }
        return limit;
    }

    protected async getRequiredEvents(): Promise<MatrixEvent[]> {
        const eventMapper = this.room.client.getEventMapper();

        let prevToken: string | null = null;

        let events: MatrixEvent[] = [];
        if (this.exportType === ExportType.Timeline) {
            events = this.room.getLiveTimeline().getEvents();
        } else {
            let limit = this.getLimit();
            while (limit) {
                const eventsPerCrawl = Math.min(limit, 1000);
                const res = await this.room.client.createMessagesRequest(
                    this.room.roomId,
                    prevToken,
                    eventsPerCrawl,
                    Direction.Backward,
                );

                if (this.cancelled) {
                    this.cleanUp();
                    return [];
                }

                if (res.chunk.length === 0) break;

                limit -= res.chunk.length;

                const matrixEvents: MatrixEvent[] = res.chunk.map(eventMapper);

                for (const mxEv of matrixEvents) {
                    // if (this.exportOptions.startDate && mxEv.getTs() < this.exportOptions.startDate) {
                    //     // Once the last message received is older than the start date, we break out of both the loops
                    //     limit = 0;
                    //     break;
                    // }
                    events.push(mxEv);
                }

                if (this.exportType === ExportType.LastNMessages) {
                    this.updateProgress(
                        _t("export_chat|fetched_n_events_with_total", {
                            count: events.length,
                            total: this.exportOptions.numberOfMessages,
                        }),
                    );
                } else {
                    this.updateProgress(
                        _t("export_chat|fetched_n_events", {
                            count: events.length,
                        }),
                    );
                }

                prevToken = res.end ?? null;
            }
            // Reverse the events so that we preserve the order
            events.reverse();
        }

        const decryptionPromises = events
            .filter((event) => event.isEncrypted())
            .map((event) => {
                return this.room.client.decryptEventIfNeeded(event, { emit: false });
            });

        // Wait for all the events to get decrypted.
        await Promise.all(decryptionPromises);

        for (let i = 0; i < events.length; i++) this.setEventMetadata(events[i]);

        return events;
    }

    /**
     * Decrypts if necessary, and fetches media from a matrix event
     * @param event - matrix event with media event content
     * @resolves when media has been fetched
     * @throws if media was unable to be fetched
     */
    protected async getMediaBlob(event: MatrixEvent): Promise<Blob> {
        let blob: Blob | undefined = undefined;
        try {
            const isEncrypted = event.isEncrypted();
            const content = event.getContent<MediaEventContent>();
            const shouldDecrypt = isEncrypted && content.hasOwnProperty("file") && event.getType() !== "m.sticker";
            if (shouldDecrypt) {
                blob = await decryptFile(content.file);
            } else {
                const media = mediaFromContent(content);
                if (!media.srcHttp) {
                    throw new Error("Cannot fetch without srcHttp");
                }
                const image = await fetch(media.srcHttp);
                blob = await image.blob();
            }
        } catch {
            logger.log("Error decrypting media");
        }
        if (!blob) {
            throw new Error("Unable to fetch file");
        }
        return blob;
    }

    public splitFileName(file: string): string[] {
        const lastDot = file.lastIndexOf(".");
        if (lastDot === -1) return [file, ""];
        const fileName = file.slice(0, lastDot);
        const ext = file.slice(lastDot + 1);
        return [fileName, "." + ext];
    }

    protected makeUniqueFilePath(details: FileDetails): string {
        const makePath = ({ directory, name, date, extension, count = 0 }: FileDetails): string =>
            `${directory}/${name}-${date}${count > 0 ? ` (${count})` : ""}${extension}`;
        const defaultPath = makePath(details);
        const count = this.fileNames.get(defaultPath) || 0;
        this.fileNames.set(defaultPath, count + 1);
        if (count > 0) {
            return makePath({ ...details, count });
        }

        return defaultPath;
    }

    public getFilePath(event: MatrixEvent): string {
        const mediaType = event.getContent().msgtype;
        let fileDirectory: string;
        switch (mediaType) {
            case "m.image":
                fileDirectory = "images";
                break;
            case "m.video":
                fileDirectory = "videos";
                break;
            case "m.audio":
                fileDirectory = "audio";
                break;
            default:
                fileDirectory = event.getType() === "m.sticker" ? "stickers" : "files";
        }
        const fileDate = formatFullDateNoDay(new Date(event.getTs()));
        let [fileName, fileExt] = this.splitFileName(event.getContent().body);

        if (event.getType() === "m.sticker") fileExt = ".png";
        if (isVoiceMessage(event)) fileExt = ".ogg";

        return this.makeUniqueFilePath({
            directory: fileDirectory,
            name: fileName,
            date: fileDate,
            extension: fileExt,
        });
    }

    protected isReply(event: MatrixEvent): boolean {
        const isEncrypted = event.isEncrypted();
        // If encrypted, in_reply_to lies in event.event.content
        const content = isEncrypted ? event.event.content! : event.getContent();
        const relatesTo = content["m.relates_to"];
        return !!(relatesTo && relatesTo["m.in_reply_to"]);
    }

    protected isAttachment(mxEv: MatrixEvent): boolean {
        const attachmentTypes = ["m.sticker", "m.image", "m.file", "m.video", "m.audio"];
        return mxEv.getType() === attachmentTypes[0] || attachmentTypes.includes(mxEv.getContent().msgtype!);
    }

    protected getRelationsForEvent = (
        eventId: string,
        relationType: RelationType | string,
        eventType: EventType | string,
    ): Relations | undefined => {
        return this.room.getUnfilteredTimelineSet().relations.getChildEventsForEvent(eventId, relationType, eventType);
    };

    public abstract export(): Promise<void>;
}
