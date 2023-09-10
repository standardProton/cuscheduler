

export function isRangeIntersection(range, ranges) {
    for (let i = 0; i < ranges.length; i++){
        if (range[0] < ranges[i][1] && range[1] > ranges[i][0]) return true;
    }
    return false;
}