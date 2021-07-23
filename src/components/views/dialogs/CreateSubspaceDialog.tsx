/*
Copyright 2021 The Matrix.org Foundation C.I.C.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import React, { useRef, useState } from "react";
import { Room } from "matrix-js-sdk/src/models/room";
import { JoinRule, Preset } from "matrix-js-sdk/src/@types/partials";
import { RoomType } from "matrix-js-sdk/src/@types/event";

import { _t } from '../../../languageHandler';
import BaseDialog from "./BaseDialog";
import AccessibleButton from "../elements/AccessibleButton";
import MatrixClientContext from "../../../contexts/MatrixClientContext";
import { BetaPill } from "../beta/BetaCard";
import Field from "../elements/Field";
import RoomAliasField from "../elements/RoomAliasField";
import SpaceStore from "../../../stores/SpaceStore";
import { SpaceCreateForm } from "../spaces/SpaceCreateMenu";
import createRoom from "../../../createRoom";
import { SubspaceSelector } from "./AddExistingToSpaceDialog";
import JoinRuleDropdown from "../elements/JoinRuleDropdown";

interface IProps {
    space: Room;
    onAddExistingSpaceClick(): void;
    onFinished(added?: boolean): void;
}

const CreateSubspaceDialog: React.FC<IProps> = ({ space, onAddExistingSpaceClick, onFinished }) => {
    const [parentSpace, setParentSpace] = useState(space);

    const [busy, setBusy] = useState<boolean>(false);
    const [name, setName] = useState("");
    const spaceNameField = useRef<Field>();
    const [alias, setAlias] = useState("");
    const spaceAliasField = useRef<RoomAliasField>();
    const [avatar, setAvatar] = useState<File>(null);
    const [topic, setTopic] = useState<string>("");

    const supportsRestricted = !!SpaceStore.instance.restrictedJoinRuleSupport?.preferred;

    const spaceJoinRule = space.getJoinRule();
    let defaultJoinRule = JoinRule.Invite;
    if (spaceJoinRule === JoinRule.Public) {
        defaultJoinRule = JoinRule.Public;
    } else if (supportsRestricted) {
        defaultJoinRule = JoinRule.Restricted;
    }
    const [joinRule, setJoinRule] = useState<JoinRule>(defaultJoinRule);

    const onCreateSubspaceClick = async (e) => {
        e.preventDefault();
        if (busy) return;

        setBusy(true);
        // require & validate the space name field
        if (!await spaceNameField.current.validate({ allowEmpty: false })) {
            spaceNameField.current.focus();
            spaceNameField.current.validate({ allowEmpty: false, focused: true });
            setBusy(false);
            return;
        }
        // validate the space name alias field but do not require it
        if (joinRule === JoinRule.Public && !await spaceAliasField.current.validate({ allowEmpty: true })) {
            spaceAliasField.current.focus();
            spaceAliasField.current.validate({ allowEmpty: true, focused: true });
            setBusy(false);
            return;
        }

        try {
            await createRoom({
                createOpts: {
                    preset: joinRule === JoinRule.Public ? Preset.PublicChat : Preset.PrivateChat,
                    name,
                    power_level_content_override: {
                        // Only allow Admins to write to the timeline to prevent hidden sync spam
                        events_default: 100,
                        ...joinRule === JoinRule.Public ? { invite: 0 } : {},
                    },
                    room_alias_name: joinRule === JoinRule.Public && alias
                        ? alias.substr(1, alias.indexOf(":") - 1)
                        : undefined,
                    topic,
                },
                avatar,
                roomType: RoomType.Space,
                parentSpace,
                spinner: false,
                encryption: false,
                andView: true,
                inlineErrors: true,
            });

            onFinished(true);
        } catch (e) {
            console.error(e);
        }
    };

    return <BaseDialog
        title={(
            <SubspaceSelector
                title={_t("Create a subspace")}
                space={space}
                value={parentSpace}
                onChange={setParentSpace}
            />
        )}
        className="mx_CreateSubspaceDialog"
        contentId="mx_CreateSubspaceDialog"
        onFinished={onFinished}
        fixedWidth={false}
    >
        <MatrixClientContext.Provider value={space.client}>
            <div className="mx_CreateSubspaceDialog_content">
                <div className="mx_CreateSubspaceDialog_betaNotice">
                    <BetaPill />
                    { _t("Add a subspace to a space you manage.") }
                </div>

                <SpaceCreateForm
                    busy={busy}
                    onSubmit={onCreateSubspaceClick}
                    setAvatar={setAvatar}
                    name={name}
                    setName={setName}
                    nameFieldRef={spaceNameField}
                    topic={topic}
                    setTopic={setTopic}
                    alias={alias}
                    setAlias={setAlias}
                    showAliasField={joinRule === JoinRule.Public}
                    aliasFieldRef={spaceAliasField}
                >
                    <JoinRuleDropdown
                        label={_t("Subspace visibility")}
                        labelInvite={_t("Private subspace (invite only)")}
                        labelPublic={_t("Public subspace")}
                        labelRestricted={supportsRestricted ? _t("Visible to space members") : undefined}
                        width={478}
                        value={joinRule}
                        onChange={setJoinRule}
                    />
                </SpaceCreateForm>
            </div>

            <div className="mx_CreateSubspaceDialog_footer">
                <div className="mx_CreateSubspaceDialog_footer_prompt">
                    <div>{ _t("Want to add an existing space instead?") }</div>
                    <AccessibleButton kind="link" onClick={() => {
                        onAddExistingSpaceClick();
                        onFinished();
                    }}>
                        { _t("Add existing space") }
                    </AccessibleButton>
                </div>

                <AccessibleButton kind="primary_outline" disabled={busy} onClick={() => onFinished(false)}>
                    { _t("Cancel") }
                </AccessibleButton>
                <AccessibleButton kind="primary" disabled={busy} onClick={onCreateSubspaceClick}>
                    { busy ? _t("Adding...") : _t("Add") }
                </AccessibleButton>
            </div>
        </MatrixClientContext.Provider>
    </BaseDialog>;
};

export default CreateSubspaceDialog;

