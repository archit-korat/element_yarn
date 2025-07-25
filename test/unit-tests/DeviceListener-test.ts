/*
Copyright 2024 New Vector Ltd.
Copyright 2022 The Matrix.org Foundation C.I.C.

SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE files in the repository root for full details.
*/

import { type Mocked, mocked } from "jest-mock";
import {
    MatrixEvent,
    type Room,
    type MatrixClient,
    Device,
    ClientStoppedError,
    ClientEvent,
} from "matrix-js-sdk/src/matrix";
import {
    CryptoEvent,
    type CrossSigningStatus,
    type CryptoApi,
    DeviceVerificationStatus,
    type KeyBackupInfo,
} from "matrix-js-sdk/src/crypto-api";
import { type CryptoSessionStateChange } from "@matrix-org/analytics-events/types/typescript/CryptoSessionStateChange";

import DeviceListener, { BACKUP_DISABLED_ACCOUNT_DATA_KEY } from "../../src/DeviceListener";
import { MatrixClientPeg } from "../../src/MatrixClientPeg";
import * as SetupEncryptionToast from "../../src/toasts/SetupEncryptionToast";
import * as UnverifiedSessionToast from "../../src/toasts/UnverifiedSessionToast";
import * as BulkUnverifiedSessionsToast from "../../src/toasts/BulkUnverifiedSessionsToast";
import { isSecretStorageBeingAccessed } from "../../src/SecurityManager";
import dis from "../../src/dispatcher/dispatcher";
import { Action } from "../../src/dispatcher/actions";
import SettingsStore from "../../src/settings/SettingsStore";
import { SettingLevel } from "../../src/settings/SettingLevel";
import { getMockClientWithEventEmitter, mockPlatformPeg } from "../test-utils";
import { UIFeature } from "../../src/settings/UIFeature";
import { isBulkUnverifiedDeviceReminderSnoozed } from "../../src/utils/device/snoozeBulkUnverifiedDeviceReminder";
import { PosthogAnalytics } from "../../src/PosthogAnalytics";

jest.mock("../../src/dispatcher/dispatcher", () => ({
    dispatch: jest.fn(),
    register: jest.fn(),
    unregister: jest.fn(),
}));

jest.mock("../../src/SecurityManager", () => ({
    isSecretStorageBeingAccessed: jest.fn(),
    accessSecretStorage: jest.fn(),
}));

jest.mock("../../src/utils/device/snoozeBulkUnverifiedDeviceReminder", () => ({
    isBulkUnverifiedDeviceReminderSnoozed: jest.fn(),
}));

const userId = "@user:server";
const deviceId = "my-device-id";
const mockDispatcher = mocked(dis);
const flushPromises = async () => await new Promise(process.nextTick);

describe("DeviceListener", () => {
    let mockClient: Mocked<MatrixClient>;
    let mockCrypto: Mocked<CryptoApi>;

    beforeEach(() => {
        jest.resetAllMocks();

        // don't litter the console with logs
        jest.spyOn(console, "debug").mockImplementation(() => {});
        jest.spyOn(console, "info").mockImplementation(() => {});
        jest.spyOn(console, "warn").mockImplementation(() => {});
        jest.spyOn(console, "error").mockImplementation(() => {});

        // spy on various toasts' hide and show functions
        // easier than mocking
        jest.spyOn(SetupEncryptionToast, "showToast").mockReturnValue(undefined);
        jest.spyOn(SetupEncryptionToast, "hideToast").mockReturnValue(undefined);
        jest.spyOn(BulkUnverifiedSessionsToast, "showToast").mockReturnValue(undefined);
        jest.spyOn(BulkUnverifiedSessionsToast, "hideToast").mockReturnValue(undefined);
        jest.spyOn(UnverifiedSessionToast, "showToast").mockResolvedValue(undefined);
        jest.spyOn(UnverifiedSessionToast, "hideToast").mockReturnValue(undefined);

        mockPlatformPeg({
            getAppVersion: jest.fn().mockResolvedValue("1.2.3"),
        });
        mockCrypto = {
            getDeviceVerificationStatus: jest.fn().mockResolvedValue({
                crossSigningVerified: false,
            }),
            getUserDeviceInfo: jest.fn().mockResolvedValue(new Map()),
            isCrossSigningReady: jest.fn().mockResolvedValue(true),
            isSecretStorageReady: jest.fn().mockResolvedValue(true),
            userHasCrossSigningKeys: jest.fn(),
            getActiveSessionBackupVersion: jest.fn(),
            getCrossSigningStatus: jest.fn().mockReturnValue({
                publicKeysOnDevice: true,
                privateKeysInSecretStorage: true,
                privateKeysCachedLocally: {
                    masterKey: true,
                    selfSigningKey: true,
                    userSigningKey: true,
                },
            }),
            getSessionBackupPrivateKey: jest.fn(),
            isEncryptionEnabledInRoom: jest.fn(),
            getKeyBackupInfo: jest.fn().mockResolvedValue(null),
        } as unknown as Mocked<CryptoApi>;
        mockClient = getMockClientWithEventEmitter({
            isGuest: jest.fn(),
            getUserId: jest.fn().mockReturnValue(userId),
            getSafeUserId: jest.fn().mockReturnValue(userId),
            getRooms: jest.fn().mockReturnValue([]),
            isVersionSupported: jest.fn().mockResolvedValue(true),
            isInitialSyncComplete: jest.fn().mockReturnValue(true),
            waitForClientWellKnown: jest.fn(),
            getClientWellKnown: jest.fn(),
            getDeviceId: jest.fn().mockReturnValue(deviceId),
            setAccountData: jest.fn(),
            getAccountData: jest.fn(),
            getAccountDataFromServer: jest.fn(),
            deleteAccountData: jest.fn(),
            getCrypto: jest.fn().mockReturnValue(mockCrypto),
            secretStorage: {
                isStored: jest.fn().mockReturnValue(null),
                getDefaultKeyId: jest.fn().mockReturnValue("00"),
            },
        });
        jest.spyOn(MatrixClientPeg, "get").mockReturnValue(mockClient);
        jest.spyOn(SettingsStore, "getValue").mockReturnValue(false);
        mocked(isBulkUnverifiedDeviceReminderSnoozed).mockClear().mockReturnValue(false);
    });

    const createAndStart = async (): Promise<DeviceListener> => {
        const instance = new DeviceListener();
        instance.start(mockClient);
        await flushPromises();
        return instance;
    };

    describe("client information", () => {
        it("watches device client information setting", async () => {
            const watchSettingSpy = jest.spyOn(SettingsStore, "watchSetting");
            const unwatchSettingSpy = jest.spyOn(SettingsStore, "unwatchSetting");
            const deviceListener = await createAndStart();

            expect(watchSettingSpy).toHaveBeenCalledWith("deviceClientInformationOptIn", null, expect.any(Function));

            deviceListener.stop();

            expect(unwatchSettingSpy).toHaveBeenCalled();
        });

        describe("when device client information feature is enabled", () => {
            beforeEach(() => {
                jest.spyOn(SettingsStore, "getValue").mockImplementation(
                    (settingName) => settingName === "deviceClientInformationOptIn",
                );
            });
            it("saves client information on start", async () => {
                await createAndStart();

                expect(mockClient!.setAccountData).toHaveBeenCalledWith(
                    `io.element.matrix_client_information.${deviceId}`,
                    { name: "Element", url: "localhost", version: "1.2.3" },
                );
            });

            it("catches error and logs when saving client information fails", async () => {
                const error = new Error("oups");
                mockClient!.setAccountData.mockRejectedValue(error);

                // doesn't throw
                await createAndStart();

                expect(console.error).toHaveBeenCalledWith(
                    "DeviceListener:",
                    "Failed to update client information",
                    error,
                );
            });

            it("saves client information on logged in action", async () => {
                const instance = await createAndStart();

                mockClient!.setAccountData.mockClear();

                // @ts-ignore calling private function
                instance.onAction({ action: Action.OnLoggedIn });

                await flushPromises();

                expect(mockClient!.setAccountData).toHaveBeenCalledWith(
                    `io.element.matrix_client_information.${deviceId}`,
                    { name: "Element", url: "localhost", version: "1.2.3" },
                );
            });
        });

        describe("when device client information feature is disabled", () => {
            const clientInfoEvent = new MatrixEvent({
                type: `io.element.matrix_client_information.${deviceId}`,
                content: { name: "hello" },
            });
            const emptyClientInfoEvent = new MatrixEvent({ type: `io.element.matrix_client_information.${deviceId}` });
            beforeEach(() => {
                jest.spyOn(SettingsStore, "getValue").mockReturnValue(false);

                mockClient!.getAccountData.mockReturnValue(undefined);
            });

            it("does not save client information on start", async () => {
                await createAndStart();

                expect(mockClient!.setAccountData).not.toHaveBeenCalled();
            });

            it("removes client information on start if it exists", async () => {
                mockClient!.getAccountData.mockReturnValue(clientInfoEvent);
                await createAndStart();

                expect(mockClient!.deleteAccountData).toHaveBeenCalledWith(
                    `io.element.matrix_client_information.${deviceId}`,
                );
            });

            it("does not try to remove client info event that are already empty", async () => {
                mockClient!.getAccountData.mockReturnValue(emptyClientInfoEvent);
                await createAndStart();

                expect(mockClient!.deleteAccountData).not.toHaveBeenCalled();
            });

            it("does not save client information on logged in action", async () => {
                const instance = await createAndStart();

                // @ts-ignore calling private function
                instance.onAction({ action: Action.OnLoggedIn });

                await flushPromises();

                expect(mockClient!.setAccountData).not.toHaveBeenCalled();
            });

            it("saves client information after setting is enabled", async () => {
                const watchSettingSpy = jest.spyOn(SettingsStore, "watchSetting");
                await createAndStart();

                const [settingName, roomId, callback] = watchSettingSpy.mock.calls[0];
                expect(settingName).toEqual("deviceClientInformationOptIn");
                expect(roomId).toBeNull();

                callback("deviceClientInformationOptIn", null, SettingLevel.DEVICE, SettingLevel.DEVICE, true);

                await flushPromises();

                expect(mockClient!.setAccountData).toHaveBeenCalledWith(
                    `io.element.matrix_client_information.${deviceId}`,
                    { name: "Element", url: "localhost", version: "1.2.3" },
                );
            });
        });
    });

    describe("recheck", () => {
        it("does nothing when cross signing feature is not supported", async () => {
            mockClient!.isVersionSupported.mockResolvedValue(false);
            await createAndStart();

            expect(mockClient!.isVersionSupported).toHaveBeenCalledWith("v1.1");
            expect(mockCrypto!.isCrossSigningReady).not.toHaveBeenCalled();
        });
        it("does nothing when crypto is not enabled", async () => {
            mockClient!.getCrypto.mockReturnValue(undefined);
            await createAndStart();

            expect(mockCrypto!.isCrossSigningReady).not.toHaveBeenCalled();
        });
        it("does nothing when initial sync is not complete", async () => {
            mockClient!.isInitialSyncComplete.mockReturnValue(false);
            await createAndStart();

            expect(mockCrypto!.isCrossSigningReady).not.toHaveBeenCalled();
        });
        it("correctly handles the client being stopped", async () => {
            mockCrypto!.isCrossSigningReady.mockImplementation(() => {
                throw new ClientStoppedError();
            });
            await createAndStart();
            expect(console.error).not.toHaveBeenCalled();
        });
        it("correctly handles other errors", async () => {
            mockCrypto!.isCrossSigningReady.mockImplementation(() => {
                throw new Error("blah");
            });
            await createAndStart();
            expect(console.error).toHaveBeenCalledTimes(1);
        });

        describe("set up encryption", () => {
            const rooms = [{ roomId: "!room1" }, { roomId: "!room2" }] as unknown as Room[];

            beforeEach(() => {
                mockCrypto!.isCrossSigningReady.mockResolvedValue(false);
                mockCrypto!.isSecretStorageReady.mockResolvedValue(false);
                mockClient!.getRooms.mockReturnValue(rooms);
                jest.spyOn(mockClient.getCrypto()!, "isEncryptionEnabledInRoom").mockResolvedValue(true);
            });

            it("hides setup encryption toast when it is dismissed", async () => {
                const instance = await createAndStart();
                instance.dismissEncryptionSetup();
                await flushPromises();
                expect(SetupEncryptionToast.hideToast).toHaveBeenCalled();
            });

            it("does not show any toasts when secret storage is being accessed", async () => {
                mocked(isSecretStorageBeingAccessed).mockReturnValue(true);
                await createAndStart();

                expect(SetupEncryptionToast.showToast).not.toHaveBeenCalled();
            });

            it("does not show any toasts when no rooms are encrypted", async () => {
                jest.spyOn(mockClient.getCrypto()!, "isEncryptionEnabledInRoom").mockResolvedValue(false);
                await createAndStart();

                expect(SetupEncryptionToast.showToast).not.toHaveBeenCalled();
            });

            it("shows verify session toast when account has cross signing", async () => {
                mockCrypto!.isCrossSigningReady.mockResolvedValue(true);
                await createAndStart();

                expect(mockCrypto!.getUserDeviceInfo).toHaveBeenCalled();
                expect(SetupEncryptionToast.showToast).toHaveBeenCalledWith(
                    SetupEncryptionToast.Kind.VERIFY_THIS_SESSION,
                );
            });

            describe("when current device is verified", () => {
                beforeEach(() => {
                    mockCrypto!.isCrossSigningReady.mockResolvedValue(true);

                    // current device is verified
                    mockCrypto!.getDeviceVerificationStatus.mockResolvedValue(
                        new DeviceVerificationStatus({
                            trustCrossSignedDevices: true,
                            crossSigningVerified: true,
                        }),
                    );
                });

                it("hides setup encryption toast when cross signing and secret storage are ready", async () => {
                    mockCrypto!.isSecretStorageReady.mockResolvedValue(true);
                    mockCrypto!.getActiveSessionBackupVersion.mockResolvedValue("1");

                    await createAndStart();
                    expect(SetupEncryptionToast.hideToast).toHaveBeenCalled();
                });

                it("shows an out-of-sync toast when one of the secrets is missing locally", async () => {
                    mockCrypto!.getCrossSigningStatus.mockResolvedValue({
                        publicKeysOnDevice: true,
                        privateKeysInSecretStorage: true,
                        privateKeysCachedLocally: {
                            masterKey: false,
                            selfSigningKey: true,
                            userSigningKey: true,
                        },
                    });

                    await createAndStart();

                    expect(SetupEncryptionToast.showToast).toHaveBeenCalledWith(
                        SetupEncryptionToast.Kind.KEY_STORAGE_OUT_OF_SYNC,
                    );
                });

                it("hides the out-of-sync toast after we receive the missing secrets", async () => {
                    mockCrypto!.isSecretStorageReady.mockResolvedValue(true);
                    mockCrypto!.getActiveSessionBackupVersion.mockResolvedValue("1");

                    // First show the toast
                    mockCrypto!.getCrossSigningStatus.mockResolvedValue({
                        publicKeysOnDevice: true,
                        privateKeysInSecretStorage: true,
                        privateKeysCachedLocally: {
                            masterKey: false,
                            selfSigningKey: true,
                            userSigningKey: true,
                        },
                    });

                    await createAndStart();

                    expect(SetupEncryptionToast.showToast).toHaveBeenCalledWith(
                        SetupEncryptionToast.Kind.KEY_STORAGE_OUT_OF_SYNC,
                    );

                    // Then, when we receive the secret, it should be hidden.
                    mockCrypto!.getCrossSigningStatus.mockResolvedValue({
                        publicKeysOnDevice: true,
                        privateKeysInSecretStorage: true,
                        privateKeysCachedLocally: {
                            masterKey: true,
                            selfSigningKey: true,
                            userSigningKey: true,
                        },
                    });

                    mockClient.emit(ClientEvent.ToDeviceEvent, new MatrixEvent({ type: "m.secret.send" }));
                    await flushPromises();
                    expect(SetupEncryptionToast.hideToast).toHaveBeenCalled();
                });

                it("shows set up recovery toast when user has a key backup available", async () => {
                    // non falsy response
                    mockCrypto.getKeyBackupInfo.mockResolvedValue({} as unknown as KeyBackupInfo);
                    mockCrypto.getActiveSessionBackupVersion.mockResolvedValue("1");
                    mockClient.secretStorage.getDefaultKeyId.mockResolvedValue(null);

                    await createAndStart();

                    expect(SetupEncryptionToast.showToast).toHaveBeenCalledWith(
                        SetupEncryptionToast.Kind.SET_UP_RECOVERY,
                    );
                });

                it("shows an out-of-sync toast when one of the secrets is missing from 4S", async () => {
                    mockCrypto.getKeyBackupInfo.mockResolvedValue({} as unknown as KeyBackupInfo);
                    mockCrypto.getActiveSessionBackupVersion.mockResolvedValue("1");
                    mockClient.secretStorage.getDefaultKeyId.mockResolvedValue("foo");

                    await createAndStart();

                    expect(SetupEncryptionToast.showToast).toHaveBeenCalledWith(
                        SetupEncryptionToast.Kind.KEY_STORAGE_OUT_OF_SYNC_STORE,
                    );
                });
            });
        });

        describe("key backup status", () => {
            it("checks keybackup status when cross signing and secret storage are ready", async () => {
                // default mocks set cross signing and secret storage to ready
                await createAndStart();
                expect(mockCrypto.getActiveSessionBackupVersion).toHaveBeenCalled();
            });

            it("checks keybackup status when setup encryption toast has been dismissed", async () => {
                mockCrypto!.isCrossSigningReady.mockResolvedValue(false);
                const instance = await createAndStart();

                instance.dismissEncryptionSetup();
                await flushPromises();

                expect(mockCrypto.getActiveSessionBackupVersion).toHaveBeenCalled();
            });

            it("dispatches keybackup event when key backup is not enabled", async () => {
                mockCrypto!.isCrossSigningReady.mockResolvedValue(true);

                // current device is verified
                mockCrypto!.getDeviceVerificationStatus.mockResolvedValue(
                    new DeviceVerificationStatus({
                        trustCrossSignedDevices: true,
                        crossSigningVerified: true,
                    }),
                );

                mockCrypto.getActiveSessionBackupVersion.mockResolvedValue(null);
                mockClient.getAccountDataFromServer.mockImplementation((eventType) =>
                    eventType === BACKUP_DISABLED_ACCOUNT_DATA_KEY ? ({ disabled: true } as any) : null,
                );
                await createAndStart();
                expect(mockDispatcher.dispatch).toHaveBeenCalledWith({
                    action: Action.ReportKeyBackupNotEnabled,
                });
            });

            it("does not check key backup status again after check is complete", async () => {
                mockCrypto.getActiveSessionBackupVersion.mockResolvedValue("1");
                const instance = await createAndStart();
                expect(mockCrypto.getActiveSessionBackupVersion).toHaveBeenCalled();

                // trigger a recheck
                instance.dismissEncryptionSetup();
                await flushPromises();
                // not called again, check was complete last time
                expect(mockCrypto.getActiveSessionBackupVersion).toHaveBeenCalledTimes(1);
            });
        });

        it("sets backup_disabled account data when we call recordKeyBackupDisabled", async () => {
            const instance = await createAndStart();
            await instance.recordKeyBackupDisabled();

            expect(mockClient.setAccountData).toHaveBeenCalledWith("m.org.matrix.custom.backup_disabled", {
                disabled: true,
            });
        });

        it("sets the recovery account data when we call recordRecoveryDisabled", async () => {
            const instance = await createAndStart();
            await instance.recordRecoveryDisabled();

            expect(mockClient.setAccountData).toHaveBeenCalledWith("io.element.recovery", {
                enabled: false,
            });
        });

        describe("when crypto is in use and set up", () => {
            beforeEach(() => {
                // Encryption is in use
                mockClient.getRooms.mockReturnValue([{ roomId: "!room1" }, { roomId: "!room2" }] as unknown as Room[]);
                jest.spyOn(mockClient.getCrypto()!, "isEncryptionEnabledInRoom").mockResolvedValue(true);

                // The device is verified
                mockCrypto.getDeviceVerificationStatus.mockResolvedValue(
                    new DeviceVerificationStatus({ crossSigningVerified: true }),
                );
            });

            describe("but key storage is off", () => {
                beforeEach(() => {
                    // There is no active key backup/storage
                    mockCrypto.getActiveSessionBackupVersion.mockResolvedValue(null);
                });

                it("shows the 'Turn on key storage' toast if we never explicitly turned off key storage", async () => {
                    // Given key backup is off but the account data saying we turned it off is not set
                    // (m.org.matrix.custom.backup_disabled)
                    mockClient.getAccountData.mockReturnValue(undefined);

                    // When we launch the DeviceListener
                    await createAndStart();

                    // Then the toast is displayed
                    expect(SetupEncryptionToast.showToast).toHaveBeenCalledWith(
                        SetupEncryptionToast.Kind.TURN_ON_KEY_STORAGE,
                    );
                });

                it("shows the 'Turn on key storage' toast if we turned on key storage", async () => {
                    // Given key backup is off but the account data says we turned it on (this should not happen - the
                    // account data should only be updated if we turn on key storage)
                    mockClient.getAccountData.mockImplementation((eventType) =>
                        eventType === BACKUP_DISABLED_ACCOUNT_DATA_KEY
                            ? new MatrixEvent({ content: { disabled: false } })
                            : undefined,
                    );

                    // When we launch the DeviceListener
                    await createAndStart();

                    // Then the toast is displayed
                    expect(SetupEncryptionToast.showToast).toHaveBeenCalledWith(
                        SetupEncryptionToast.Kind.TURN_ON_KEY_STORAGE,
                    );
                });

                it("does not show the 'Turn on key storage' toast if we turned off key storage", async () => {
                    // Given key backup is off but the account data saying we turned it off is set
                    mockClient.getAccountDataFromServer.mockImplementation((eventType) =>
                        eventType === BACKUP_DISABLED_ACCOUNT_DATA_KEY ? ({ disabled: true } as any) : null,
                    );

                    // When we launch the DeviceListener
                    await createAndStart();

                    // Then the toast is not displayed
                    expect(SetupEncryptionToast.showToast).not.toHaveBeenCalledWith(
                        SetupEncryptionToast.Kind.TURN_ON_KEY_STORAGE,
                    );
                });
            });

            describe("and key storage is on", () => {
                beforeEach(() => {
                    // There is an active key backup/storage
                    mockCrypto.getActiveSessionBackupVersion.mockResolvedValue("1");
                });

                it("does not show the 'Turn on key storage' toast if we never explicitly turned off key storage", async () => {
                    // Given key backup is on and the account data saying we turned it off is not set
                    mockClient.getAccountData.mockReturnValue(undefined);

                    // When we launch the DeviceListener
                    await createAndStart();

                    // Then the toast is not displayed
                    expect(SetupEncryptionToast.showToast).not.toHaveBeenCalledWith(
                        SetupEncryptionToast.Kind.TURN_ON_KEY_STORAGE,
                    );
                });

                it("does not show the 'Turn on key storage' toast if we turned on key storage", async () => {
                    // Given key backup is on and the account data says we turned it on
                    mockClient.getAccountData.mockImplementation((eventType) =>
                        eventType === BACKUP_DISABLED_ACCOUNT_DATA_KEY
                            ? new MatrixEvent({ content: { disabled: false } })
                            : undefined,
                    );

                    // When we launch the DeviceListener
                    await createAndStart();

                    // Then the toast is not displayed
                    expect(SetupEncryptionToast.showToast).not.toHaveBeenCalledWith(
                        SetupEncryptionToast.Kind.TURN_ON_KEY_STORAGE,
                    );
                });

                it("does not show the 'Turn on key storage' toast if we turned off key storage", async () => {
                    // Given key backup is on but the account data saying we turned it off is set (this should never
                    // happen - it should only be set when we turn off key storage or dismiss the toast)
                    mockClient.getAccountData.mockImplementation((eventType) =>
                        eventType === BACKUP_DISABLED_ACCOUNT_DATA_KEY
                            ? new MatrixEvent({ content: { disabled: true } })
                            : undefined,
                    );

                    // When we launch the DeviceListener
                    await createAndStart();

                    // Then the toast is not displayed
                    expect(SetupEncryptionToast.showToast).not.toHaveBeenCalledWith(
                        SetupEncryptionToast.Kind.TURN_ON_KEY_STORAGE,
                    );
                });
            });
        });

        describe("unverified sessions toasts", () => {
            const currentDevice = new Device({ deviceId, userId: userId, algorithms: [], keys: new Map() });
            const device2 = new Device({ deviceId: "d2", userId: userId, algorithms: [], keys: new Map() });
            const device3 = new Device({ deviceId: "d3", userId: userId, algorithms: [], keys: new Map() });

            const deviceTrustVerified = new DeviceVerificationStatus({ crossSigningVerified: true });
            const deviceTrustUnverified = new DeviceVerificationStatus({});

            beforeEach(() => {
                mockCrypto!.isCrossSigningReady.mockResolvedValue(true);
                mockCrypto!.getUserDeviceInfo.mockResolvedValue(
                    new Map([[userId, new Map([currentDevice, device2, device3].map((d) => [d.deviceId, d]))]]),
                );
                // all devices verified by default
                mockCrypto!.getDeviceVerificationStatus.mockResolvedValue(deviceTrustVerified);
                mockClient!.deviceId = currentDevice.deviceId;
                jest.spyOn(SettingsStore, "getValue").mockImplementation(
                    (settingName) => settingName === UIFeature.BulkUnverifiedSessionsReminder,
                );
            });
            describe("bulk unverified sessions toasts", () => {
                it("hides toast when cross signing is not ready", async () => {
                    mockCrypto!.isCrossSigningReady.mockResolvedValue(false);
                    await createAndStart();
                    expect(BulkUnverifiedSessionsToast.hideToast).toHaveBeenCalled();
                    expect(BulkUnverifiedSessionsToast.showToast).not.toHaveBeenCalled();
                });

                it("hides toast when all devices at app start are verified", async () => {
                    await createAndStart();
                    expect(BulkUnverifiedSessionsToast.hideToast).toHaveBeenCalled();
                    expect(BulkUnverifiedSessionsToast.showToast).not.toHaveBeenCalled();
                });

                it("hides toast when feature is disabled", async () => {
                    // BulkUnverifiedSessionsReminder set to false
                    jest.spyOn(SettingsStore, "getValue").mockReturnValue(false);
                    // currentDevice, device2 are verified, device3 is unverified
                    // ie if reminder was enabled it should be shown
                    mockCrypto!.getDeviceVerificationStatus.mockImplementation(async (_userId, deviceId) => {
                        switch (deviceId) {
                            case currentDevice.deviceId:
                            case device2.deviceId:
                                return deviceTrustVerified;
                            default:
                                return deviceTrustUnverified;
                        }
                    });
                    await createAndStart();
                    expect(BulkUnverifiedSessionsToast.hideToast).toHaveBeenCalled();
                });

                it("hides toast when current device is unverified", async () => {
                    // device2 verified, current and device3 unverified
                    mockCrypto!.getDeviceVerificationStatus.mockImplementation(async (_userId, deviceId) => {
                        switch (deviceId) {
                            case device2.deviceId:
                                return deviceTrustVerified;
                            default:
                                return deviceTrustUnverified;
                        }
                    });
                    await createAndStart();
                    expect(BulkUnverifiedSessionsToast.hideToast).toHaveBeenCalled();
                    expect(BulkUnverifiedSessionsToast.showToast).not.toHaveBeenCalled();
                });

                it("hides toast when reminder is snoozed", async () => {
                    mocked(isBulkUnverifiedDeviceReminderSnoozed).mockReturnValue(true);
                    // currentDevice, device2 are verified, device3 is unverified
                    mockCrypto!.getDeviceVerificationStatus.mockImplementation(async (_userId, deviceId) => {
                        switch (deviceId) {
                            case currentDevice.deviceId:
                            case device2.deviceId:
                                return deviceTrustVerified;
                            default:
                                return deviceTrustUnverified;
                        }
                    });
                    await createAndStart();
                    expect(BulkUnverifiedSessionsToast.showToast).not.toHaveBeenCalled();
                    expect(BulkUnverifiedSessionsToast.hideToast).toHaveBeenCalled();
                });

                it("shows toast with unverified devices at app start", async () => {
                    // currentDevice, device2 are verified, device3 is unverified
                    mockCrypto!.getDeviceVerificationStatus.mockImplementation(async (_userId, deviceId) => {
                        switch (deviceId) {
                            case currentDevice.deviceId:
                            case device2.deviceId:
                                return deviceTrustVerified;
                            default:
                                return deviceTrustUnverified;
                        }
                    });
                    await createAndStart();
                    expect(BulkUnverifiedSessionsToast.showToast).toHaveBeenCalledWith(
                        new Set<string>([device3.deviceId]),
                    );
                    expect(BulkUnverifiedSessionsToast.hideToast).not.toHaveBeenCalled();
                });

                it("hides toast when unverified sessions at app start have been dismissed", async () => {
                    // currentDevice, device2 are verified, device3 is unverified
                    mockCrypto!.getDeviceVerificationStatus.mockImplementation(async (_userId, deviceId) => {
                        switch (deviceId) {
                            case currentDevice.deviceId:
                            case device2.deviceId:
                                return deviceTrustVerified;
                            default:
                                return deviceTrustUnverified;
                        }
                    });
                    const instance = await createAndStart();
                    expect(BulkUnverifiedSessionsToast.showToast).toHaveBeenCalledWith(
                        new Set<string>([device3.deviceId]),
                    );

                    await instance.dismissUnverifiedSessions([device3.deviceId]);
                    await flushPromises();

                    expect(BulkUnverifiedSessionsToast.hideToast).toHaveBeenCalled();
                });

                it("hides toast when unverified sessions are added after app start", async () => {
                    // currentDevice, device2 are verified, device3 is unverified
                    mockCrypto!.getDeviceVerificationStatus.mockImplementation(async (_userId, deviceId) => {
                        switch (deviceId) {
                            case currentDevice.deviceId:
                            case device2.deviceId:
                                return deviceTrustVerified;
                            default:
                                return deviceTrustUnverified;
                        }
                    });
                    mockCrypto!.getUserDeviceInfo.mockResolvedValue(
                        new Map([[userId, new Map([currentDevice, device2].map((d) => [d.deviceId, d]))]]),
                    );
                    await createAndStart();

                    expect(BulkUnverifiedSessionsToast.hideToast).toHaveBeenCalled();

                    // add an unverified device
                    mockCrypto!.getUserDeviceInfo.mockResolvedValue(
                        new Map([[userId, new Map([currentDevice, device2, device3].map((d) => [d.deviceId, d]))]]),
                    );
                    // trigger a recheck
                    mockClient!.emit(CryptoEvent.DevicesUpdated, [userId], false);
                    await flushPromises();

                    // bulk unverified sessions toast only shown for devices that were
                    // there at app start
                    // individual nags are shown for new unverified devices
                    expect(BulkUnverifiedSessionsToast.hideToast).toHaveBeenCalledTimes(2);
                    expect(BulkUnverifiedSessionsToast.showToast).not.toHaveBeenCalled();
                });
            });
        });

        describe("Report verification and recovery state to Analytics", () => {
            let setPropertySpy: jest.SpyInstance;
            let trackEventSpy: jest.SpyInstance;

            beforeEach(() => {
                setPropertySpy = jest.spyOn(PosthogAnalytics.instance, "setProperty");
                trackEventSpy = jest.spyOn(PosthogAnalytics.instance, "trackEvent");
            });

            describe("Report crypto verification state to analytics", () => {
                type VerificationTestCases = [string, Partial<DeviceVerificationStatus>, "Verified" | "NotVerified"];

                const testCases: VerificationTestCases[] = [
                    [
                        "Identity trusted and device is signed by owner",
                        {
                            signedByOwner: true,
                            crossSigningVerified: true,
                        },
                        "Verified",
                    ],
                    [
                        "Identity is trusted, but device is not signed",
                        {
                            signedByOwner: false,
                            crossSigningVerified: true,
                        },
                        "NotVerified",
                    ],
                    [
                        "Identity is not trusted, device not signed",
                        {
                            signedByOwner: false,
                            crossSigningVerified: false,
                        },
                        "NotVerified",
                    ],
                    [
                        "Identity is not trusted, and device signed",
                        {
                            signedByOwner: true,
                            crossSigningVerified: false,
                        },
                        "NotVerified",
                    ],
                ];

                beforeEach(() => {
                    mockClient.secretStorage.getDefaultKeyId.mockResolvedValue(null);
                    mockCrypto.isSecretStorageReady.mockResolvedValue(false);
                });

                it.each(testCases)("Does report session verification state when %s", async (_, status, expected) => {
                    mockCrypto!.getDeviceVerificationStatus.mockResolvedValue(status as DeviceVerificationStatus);
                    await createAndStart();

                    // Should have updated user properties
                    expect(setPropertySpy).toHaveBeenCalledWith("verificationState", expected);

                    // Should have reported a status change event
                    const expectedTrackedEvent: CryptoSessionStateChange = {
                        eventName: "CryptoSessionState",
                        verificationState: expected,
                        recoveryState: "Disabled",
                    };
                    expect(trackEventSpy).toHaveBeenCalledWith(expectedTrackedEvent);
                });

                it("should not report a status event if no changes", async () => {
                    mockCrypto!.getDeviceVerificationStatus.mockResolvedValue({
                        signedByOwner: true,
                        crossSigningVerified: true,
                    } as unknown as DeviceVerificationStatus);

                    await createAndStart();

                    const expectedTrackedEvent: CryptoSessionStateChange = {
                        eventName: "CryptoSessionState",
                        verificationState: "Verified",
                        recoveryState: "Disabled",
                    };
                    expect(trackEventSpy).toHaveBeenCalledTimes(1);
                    expect(trackEventSpy).toHaveBeenCalledWith(expectedTrackedEvent);

                    // simulate a recheck
                    mockClient.emit(CryptoEvent.DevicesUpdated, [userId], false);
                    await flushPromises();
                    expect(trackEventSpy).toHaveBeenCalledTimes(1);

                    // Now simulate a change
                    mockCrypto!.getDeviceVerificationStatus.mockResolvedValue({
                        signedByOwner: false,
                        crossSigningVerified: true,
                    } as unknown as DeviceVerificationStatus);

                    // simulate a recheck
                    mockClient.emit(CryptoEvent.DevicesUpdated, [userId], false);
                    await flushPromises();
                    expect(trackEventSpy).toHaveBeenCalledTimes(2);
                });
            });

            describe("Report crypto recovery state to analytics", () => {
                beforeEach(() => {
                    // During all these tests we want verification state to be verified.
                    mockCrypto!.getDeviceVerificationStatus.mockResolvedValue({
                        signedByOwner: true,
                        crossSigningVerified: true,
                    } as unknown as DeviceVerificationStatus);
                });

                describe("When Room Key Backup is not enabled", () => {
                    beforeEach(() => {
                        // no backup
                        mockCrypto.getKeyBackupInfo.mockResolvedValue(null);
                    });

                    it("Should report recovery state as Enabled", async () => {
                        // 4S is enabled
                        mockClient.secretStorage.getDefaultKeyId.mockResolvedValue("00");

                        // Session trusted and cross signing secrets in 4S and stored locally
                        mockCrypto!.getCrossSigningStatus.mockResolvedValue({
                            publicKeysOnDevice: true,
                            privateKeysInSecretStorage: true,
                            privateKeysCachedLocally: {
                                masterKey: true,
                                selfSigningKey: true,
                                userSigningKey: true,
                            },
                        });

                        await createAndStart();

                        // Should have updated user properties
                        expect(setPropertySpy).toHaveBeenCalledWith("verificationState", "Verified");
                        expect(setPropertySpy).toHaveBeenCalledWith("recoveryState", "Enabled");

                        // Should have reported a status change event
                        const expectedTrackedEvent: CryptoSessionStateChange = {
                            eventName: "CryptoSessionState",
                            verificationState: "Verified",
                            recoveryState: "Enabled",
                        };
                        expect(trackEventSpy).toHaveBeenCalledWith(expectedTrackedEvent);
                    });

                    it("Should report recovery state as Incomplete if secrets not cached locally", async () => {
                        // 4S is enabled
                        mockClient.secretStorage.getDefaultKeyId.mockResolvedValue("00");

                        // Session trusted and cross signing secrets in 4S and stored locally
                        mockCrypto!.getCrossSigningStatus.mockResolvedValue({
                            publicKeysOnDevice: true,
                            privateKeysInSecretStorage: true,
                            privateKeysCachedLocally: {
                                masterKey: false,
                                selfSigningKey: true,
                                userSigningKey: true,
                            },
                        });

                        // no backup
                        mockCrypto.getKeyBackupInfo.mockResolvedValue(null);

                        await createAndStart();

                        // Should have updated user properties
                        expect(setPropertySpy).toHaveBeenCalledWith("verificationState", "Verified");
                        expect(setPropertySpy).toHaveBeenCalledWith("recoveryState", "Incomplete");

                        // Should have reported a status change event
                        const expectedTrackedEvent: CryptoSessionStateChange = {
                            eventName: "CryptoSessionState",
                            verificationState: "Verified",
                            recoveryState: "Incomplete",
                        };
                        expect(trackEventSpy).toHaveBeenCalledWith(expectedTrackedEvent);
                    });

                    const baseState: CrossSigningStatus = {
                        publicKeysOnDevice: true,
                        privateKeysInSecretStorage: true,
                        privateKeysCachedLocally: {
                            masterKey: true,
                            selfSigningKey: true,
                            userSigningKey: true,
                        },
                    };
                    type MissingSecretsInCacheTestCases = [string, CrossSigningStatus];

                    const partialTestCases: MissingSecretsInCacheTestCases[] = [
                        [
                            "MSK not cached",
                            {
                                ...baseState,
                                privateKeysCachedLocally: { ...baseState.privateKeysCachedLocally, masterKey: false },
                            },
                        ],
                        [
                            "SSK not cached",
                            {
                                ...baseState,
                                privateKeysCachedLocally: {
                                    ...baseState.privateKeysCachedLocally,
                                    selfSigningKey: false,
                                },
                            },
                        ],
                        [
                            "USK not cached",
                            {
                                ...baseState,
                                privateKeysCachedLocally: {
                                    ...baseState.privateKeysCachedLocally,
                                    userSigningKey: false,
                                },
                            },
                        ],
                        [
                            "MSK/USK not cached",
                            {
                                ...baseState,
                                privateKeysCachedLocally: {
                                    ...baseState.privateKeysCachedLocally,
                                    masterKey: false,
                                    userSigningKey: false,
                                },
                            },
                        ],
                        [
                            "MSK/SSK not cached",
                            {
                                ...baseState,
                                privateKeysCachedLocally: {
                                    ...baseState.privateKeysCachedLocally,
                                    masterKey: false,
                                    selfSigningKey: false,
                                },
                            },
                        ],
                        [
                            "USK/SSK not cached",
                            {
                                ...baseState,
                                privateKeysCachedLocally: {
                                    ...baseState.privateKeysCachedLocally,
                                    userSigningKey: false,
                                    selfSigningKey: false,
                                },
                            },
                        ],
                    ];

                    it.each(partialTestCases)(
                        "Should report recovery state as Incomplete when %s",
                        async (_, status) => {
                            mockClient.secretStorage.getDefaultKeyId.mockResolvedValue("00");

                            // Session trusted and cross signing secrets in 4S and stored locally
                            mockCrypto!.getCrossSigningStatus.mockResolvedValue(status);

                            await createAndStart();

                            // Should have updated user properties
                            expect(setPropertySpy).toHaveBeenCalledWith("verificationState", "Verified");
                            expect(setPropertySpy).toHaveBeenCalledWith("recoveryState", "Incomplete");

                            // Should have reported a status change event
                            const expectedTrackedEvent: CryptoSessionStateChange = {
                                eventName: "CryptoSessionState",
                                verificationState: "Verified",
                                recoveryState: "Incomplete",
                            };
                            expect(trackEventSpy).toHaveBeenCalledWith(expectedTrackedEvent);
                        },
                    );

                    it("Should report recovery state as Incomplete when some secrets are not in 4S", async () => {
                        mockClient.secretStorage.getDefaultKeyId.mockResolvedValue("00");

                        // Some missing secret in 4S
                        mockCrypto.isSecretStorageReady.mockResolvedValue(false);

                        // Session trusted and secrets known locally.
                        mockCrypto!.getCrossSigningStatus.mockResolvedValue({
                            publicKeysOnDevice: true,
                            privateKeysCachedLocally: {
                                masterKey: true,
                                selfSigningKey: true,
                                userSigningKey: true,
                            },
                        } as unknown as CrossSigningStatus);

                        await createAndStart();

                        // Should have updated user properties
                        expect(setPropertySpy).toHaveBeenCalledWith("verificationState", "Verified");
                        expect(setPropertySpy).toHaveBeenCalledWith("recoveryState", "Incomplete");

                        // Should have reported a status change event
                        const expectedTrackedEvent: CryptoSessionStateChange = {
                            eventName: "CryptoSessionState",
                            verificationState: "Verified",
                            recoveryState: "Incomplete",
                        };
                        expect(trackEventSpy).toHaveBeenCalledWith(expectedTrackedEvent);
                    });
                });

                describe("When Room Key Backup is enabled", () => {
                    beforeEach(() => {
                        // backup enabled - just need a mock object
                        mockCrypto.getKeyBackupInfo.mockResolvedValue({} as KeyBackupInfo);
                    });

                    const testCases = [
                        ["as Incomplete if backup key not cached locally", false],
                        ["as Enabled if backup key is cached locally", true],
                    ];
                    it.each(testCases)("Should report recovery state as %s", async (_, isCached) => {
                        // 4S is enabled
                        mockClient.secretStorage.getDefaultKeyId.mockResolvedValue("00");

                        // Session trusted and cross signing secrets in 4S and stored locally
                        mockCrypto!.getCrossSigningStatus.mockResolvedValue({
                            publicKeysOnDevice: true,
                            privateKeysInSecretStorage: true,
                            privateKeysCachedLocally: {
                                masterKey: true,
                                selfSigningKey: true,
                                userSigningKey: true,
                            },
                        });

                        mockCrypto.getSessionBackupPrivateKey.mockResolvedValue(isCached ? new Uint8Array() : null);

                        await createAndStart();

                        expect(setPropertySpy).toHaveBeenCalledWith("verificationState", "Verified");
                        expect(setPropertySpy).toHaveBeenCalledWith(
                            "recoveryState",
                            isCached ? "Enabled" : "Incomplete",
                        );

                        // Should have reported a status change event
                        const expectedTrackedEvent: CryptoSessionStateChange = {
                            eventName: "CryptoSessionState",
                            verificationState: "Verified",
                            recoveryState: isCached ? "Enabled" : "Incomplete",
                        };
                        expect(trackEventSpy).toHaveBeenCalledWith(expectedTrackedEvent);
                    });
                });
            });
        });

        describe("set up recovery", () => {
            const rooms = [{ roomId: "!room1" }] as unknown as Room[];

            beforeEach(() => {
                mockCrypto!.getDeviceVerificationStatus.mockResolvedValue(
                    new DeviceVerificationStatus({
                        trustCrossSignedDevices: true,
                        crossSigningVerified: true,
                    }),
                );
                mockCrypto!.isCrossSigningReady.mockResolvedValue(true);
                mockCrypto!.isSecretStorageReady.mockResolvedValue(false);
                mockClient.secretStorage.getDefaultKeyId.mockResolvedValue(null);
                mockClient!.getRooms.mockReturnValue(rooms);
                jest.spyOn(mockClient.getCrypto()!, "isEncryptionEnabledInRoom").mockResolvedValue(true);
            });

            it("shows the 'set up recovery' toast if user has not set up 4S", async () => {
                mockCrypto!.getActiveSessionBackupVersion.mockResolvedValue("1");

                await createAndStart();

                expect(SetupEncryptionToast.showToast).toHaveBeenCalledWith(SetupEncryptionToast.Kind.SET_UP_RECOVERY);
            });

            it("does not show the 'set up recovery' toast if secret storage is set up", async () => {
                mockCrypto!.isSecretStorageReady.mockResolvedValue(true);
                mockClient.secretStorage.getDefaultKeyId.mockResolvedValue("thiskey");
                await createAndStart();

                expect(SetupEncryptionToast.showToast).not.toHaveBeenCalledWith(
                    SetupEncryptionToast.Kind.SET_UP_RECOVERY,
                );
            });

            it("does not show the 'set up recovery' toast if user has no encrypted rooms", async () => {
                jest.spyOn(mockClient.getCrypto()!, "isEncryptionEnabledInRoom").mockResolvedValue(false);
                await createAndStart();

                expect(SetupEncryptionToast.showToast).not.toHaveBeenCalledWith(
                    SetupEncryptionToast.Kind.SET_UP_RECOVERY,
                );
            });

            it("does not show the 'set up recovery' toast if the user has chosen to disable key storage", async () => {
                mockClient!.getAccountData.mockImplementation((k: string) => {
                    if (k === "m.org.matrix.custom.backup_disabled") {
                        return new MatrixEvent({ content: { disabled: true } });
                    }
                    return undefined;
                });
                await createAndStart();

                expect(SetupEncryptionToast.showToast).not.toHaveBeenCalledWith(
                    SetupEncryptionToast.Kind.SET_UP_RECOVERY,
                );
            });
        });
    });
});
