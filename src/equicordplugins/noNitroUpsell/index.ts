/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import definePlugin from "@utils/types";
import { UserStore } from "@webpack/common";
import { User } from "discord-types/general";

let user: ModifiedUser | undefined;
let lastUserId: string | undefined;

interface ModifiedUser extends User {
    _realPremiumType?: number;
}

const onChange = () => {
    const newUser = UserStore.getCurrentUser();
    if (newUser && newUser.id !== lastUserId) {
        user = newUser;
        ready(user);
    }
};

function ready(user: ModifiedUser) {
    if (!user) return;
    if ("_realPremiumType" in user) return;

    user._realPremiumType = user.premiumType ?? 0;
    user.premiumType = 2;
    lastUserId = user.id;
}

export default definePlugin({
    name: "NoNitroUpsell",
    description: "Removes ALL of Discord's nitro upsells by tricking the client into thinking you have nitro.",
    authors: [{ name: "thororen", id: 848339671629299742n }],
    patches: [
        {
            find: "ProductCatalog",
            replacement: {
                match: /\i\.warn\("Cannot find the corresponding SKU to the user's premium type "\.concat\(\i\.premiumType\)\),/,
                replace: ""
            }
        }
    ],
    start() {
        user = UserStore.getCurrentUser();
        if (user) ready(user);

        UserStore.addChangeListener(onChange);
    },
    stop() {
        const user = UserStore.getCurrentUser();
        if (!user) return;
        if (!("_realPremiumType" in user)) return;
        // @ts-ignore
        user.premiumType = user._realPremiumType;
        delete user._realPremiumType;
        UserStore.removeChangeListener(onChange);
    }
});
