import { communityGroupsData, roleLabels, prepareGroupForClient } from "./communityData";

const dailyCircle = communityGroupsData.find((group) => group.slug === "cercul-zilnic-de-sprijin");

export const groupInfo = prepareGroupForClient(dailyCircle);
export const rawDialogues = dailyCircle?.dialogues ?? [];
export { roleLabels };
export default groupInfo;
