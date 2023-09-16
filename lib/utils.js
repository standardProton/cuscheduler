import styles from "styles/Main.module.css";

export function isRangeIntersection(range, ranges) {
    for (let i = 0; i < ranges.length; i++){
        if (range[0] < ranges[i][1] && range[1] > ranges[i][0]) return true;
    }
    return false;
}

export function isSameSchedule(sch1, sch2){
    if(sch1.classes.length != sch2.classes.length) return false;
    const start_times = {};
    for (let i = 0; i < sch1.length; i++){
        const cl = sch1.classes[i];
        start_times[cl.title + " " + cl.type] = cl.meeting_times;
    }
    const start_times2 = {};
    for (let i = 0; i < sch2.length; i++){
        const cl = sch2.classes[i];
        start_times2[cl.title + " " + cl.type] = cl.meeting_times;
    }
    for (const [cl, meetings] of Object.entries(start_times)){
        if (start_times2[cl] == undefined || JSON.stringify(start_times2[cl]) != JSON.stringify(meetings)) return false;
    }
    return true;
}

export function renderScheduleSVG(width, height, schedule, color_key, setColorKey){
    const marginx_right = 5, marginx_left = 9000/width, marginy = 5; //percent
    const w = (100 - (marginx_left + marginx_right)), h = (100 - (2*marginy));

    const getX = (i) => {return (marginx_left + (i*w/5.0))}
    const getY = (i) => {return ((i*h/10.75) + marginy)}

    //const colors = ["#666A86", "#788AA3", "#92B6B1", "#B2C9AB", "#E8DDB5"] //slate palette

    //const color_key = {};
    var color_count = Object.entries(color_key).length % 5;

    const r = (
        <svg width={width} height={1.2*height}>

            {schedule != null && (<><g className={styles.avoid_times}>
                {schedule.avoid_times.map((hours_list, i) => (<g key={"avoid-day-" + i}>
                    {hours_list.map((hour_set, j) => {
                    if (hour_set.length < 2) return (<g key={"avoid-" + i + "-" + j}></g>);

                    return (<g key={"avoid-" + i + "-" + j}>
                        <rect x={getX(i) + "%"} y={getY(hour_set[0]/12.0) + "%"} height={(getY(hour_set[1]/12.0) - getY(hour_set[0]/12.0)) + "%"} width={(w/5) + "%"}></rect>
                    </g>)})}
                </g>))}
            </g>
            </>)}

            <g fill="white">
                {Array.from(new Array(11), (x, i) => i).map(i => (<g key={"horizontal-" + i}>
                    <rect x={(marginx_left) + "%"} y={getY(i) + "%"} height="2" width={w + "%"}></rect>
                    <text x={(0.2*marginx_left) + "%"} y ={(getY(i) + 1) + "%"}>{(((i+7) % 12) + 1) + ":00"}</text>
                </g>))}
                {Array.from(new Array(6), (x, i) => i).map(i => (<g key={"vertical-" + i}>
                    <rect x={getX(i) + "%"} y={marginy + "%"} width="2" height={h + "%"}></rect>
                </g>))}
            </g>

            {schedule != null && (<>
            <g>
                {schedule.classes.map((cl, i) => (<g key={"class-set-" + i}>
                    {cl.meeting_times.map(meeting_time => {
                        const x = getX(meeting_time.day) + 0.14, y = getY(meeting_time.start_time/12.0) + 0.08;
                        //style={{fill: colors[i % colors.length]}}

                        var color_num = color_key[cl.title];
                        if (color_num == undefined) {
                            color_num = color_count;
                            color_key[cl.title] = color_num;
                            color_count = (color_count+1) % 5;
                        }

                        return (<g key={"class-" + i + "-day-" + meeting_time.day}>
                        <rect x={x + "%"} y={y + "%"} width={((w/5) - 0.14) + "%"} 
                        height={(getY(meeting_time.end_time/12.0) - y) + "%"} 
                        className={styles["palette-" + color_num]} rx="6" ry="6" key={"class-" + cl.title + "-day-" + meeting_time.day}></rect>
                        
                        <g style={{fill: "#FFF"}} fontSize={width > 900 ? "13pt" : "8pt"}>
                            <text x={(x+0.5) + "%"} y={(y+2.4) + "%"} fontWeight="bold">{cl.title}</text>
                            <text x={(x+0.5) + "%"} y={(y+5) + "%"}>{(width > 590 ? "Section " : "") + cl.section + (width > 400 ? " (" + cl.type + ")" : "")}</text>
                        </g>
                        </g>)
                    })}
                </g>))}
            </g>
            </>)}
        </svg>
    )
    setColorKey(color_key);
    return r;
}