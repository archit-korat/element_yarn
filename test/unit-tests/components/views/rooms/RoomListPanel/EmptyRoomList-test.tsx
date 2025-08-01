/*
 * Copyright 2025 New Vector Ltd.
 *
 * SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
 * Please see LICENSE files in the repository root for full details.
 */

import React from "react";
import { render, screen } from "jest-matrix-react";
import userEvent from "@testing-library/user-event";

import { type RoomListViewState } from "../../../../../../src/components/viewmodels/roomlist/RoomListViewModel";
import { EmptyRoomList } from "../../../../../../src/components/views/rooms/RoomListPanel/EmptyRoomList";
import { FilterKey } from "../../../../../../src/stores/room-list-v3/skip-list/filters";

describe("<EmptyRoomList />", () => {
    let vm: RoomListViewState;

    beforeEach(() => {
        vm = {
            isLoadingRooms: false,
            rooms: [],
            primaryFilters: [],
            createRoom: jest.fn(),
            createChatRoom: jest.fn(),
            canCreateRoom: true,
            activeIndex: undefined,
        };
    });

    test("should render the default placeholder when there is no filter", async () => {
        const user = userEvent.setup();

        const { asFragment } = render(<EmptyRoomList vm={vm} />);
        expect(screen.getByText("No chats yet")).toBeInTheDocument();
        expect(asFragment()).toMatchSnapshot();

        await user.click(screen.getByRole("button", { name: "New message" }));
        expect(vm.createChatRoom).toHaveBeenCalled();

        await user.click(screen.getByRole("button", { name: "New room" }));
        expect(vm.createRoom).toHaveBeenCalled();
    });

    test("should not render the new room button if the user doesn't have the rights to create a room", async () => {
        const newState = { ...vm, canCreateRoom: false };

        const { asFragment } = render(<EmptyRoomList vm={newState} />);
        expect(screen.queryByRole("button", { name: "New room" })).toBeNull();
        expect(asFragment()).toMatchSnapshot();
    });

    it.each([
        { key: FilterKey.UnreadFilter, name: "unread", action: "Show all chats" },
        { key: FilterKey.MentionsFilter, name: "mention", action: "See all activity" },
        { key: FilterKey.InvitesFilter, name: "invite", action: "See all activity" },
        { key: FilterKey.LowPriorityFilter, name: "low priority", action: "See all activity" },
    ])("should display the empty state for the $name filter", async ({ key, name, action }) => {
        const user = userEvent.setup();
        const activePrimaryFilter = {
            toggle: jest.fn(),
            active: true,
            name,
            key,
        };
        const newState = {
            ...vm,
            activePrimaryFilter,
        };

        const { asFragment } = render(<EmptyRoomList vm={newState} />);
        await user.click(screen.getByRole("button", { name: action }));
        expect(activePrimaryFilter.toggle).toHaveBeenCalled();
        expect(asFragment()).toMatchSnapshot();
    });

    it.each([
        { key: FilterKey.FavouriteFilter, name: "favourite" },
        { key: FilterKey.PeopleFilter, name: "people" },
        { key: FilterKey.RoomsFilter, name: "rooms" },
    ])("should display empty state for filter $name", ({ name, key }) => {
        const activePrimaryFilter = {
            toggle: jest.fn(),
            active: true,
            name,
            key,
        };
        const newState = { ...vm, activePrimaryFilter };
        const { asFragment } = render(<EmptyRoomList vm={newState} />);
        expect(asFragment()).toMatchSnapshot();
    });
});
