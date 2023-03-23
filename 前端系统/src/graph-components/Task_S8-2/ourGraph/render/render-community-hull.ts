import { Node, Community } from "../interface";
import { globalCfg } from "@/graph-components/common/static-const-value";

/**
 * 绘制超点展开后的凸包元素
 * @param graphInstance 图谱数据
 * @param Community 社区数据
 * @param duration 凸包淡入过渡时间
 */

const renderCommunityHull = (
    graphInstance: any,
    community: Community,
    duration: number = 600
) => {
    // 绘制超点凸包
    const hullEl = graphInstance.container
        .select("g.hullsG")
        .append("path")
        .attr("class", "hullG")
        .attr("id", `hullG-${community.communityID}`)
        .datum(community)
        .attr("fill", globalCfg.abstractHullFill);
    hullEl.attr("opacity", 0).transition().duration(duration).attr("opacity", 1);
};

export default renderCommunityHull;
