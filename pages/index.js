
import Head from "next/head.js";
import { CUtoModelTime, ModelToCUTime } from "lib/cu_utils.js";
import { useState, useEffect } from "react";
import Button from "@mui/material/Button";
import styles from "styles/Main.module.css";
import Image from "next/Image";
import { preschedule_json } from "lib/json/preschedule.js";
import { example_schedule } from "lib/json/example_schedule.js";

export default function Index(){

    const [page_setup, setPageSetup] = useState(false);
    const [schedule_svg, setScheduleSVG] = useState(null);
    const [loading, setLoading] = useState(false);
    const [status_message, setStatusText] = useState("Brought to you by a fellow Buff!");
    const [preschedule, setPreSchedule] = useState(preschedule_json);
    const [schedule, setSchedule] = useState(example_schedule);

    useEffect(() => {
        if (typeof window == "undefined" || page_setup) return;

        function update(){
            var width = window.innerWidth;
            if (window.innerWidth > 650) { //update with phone threshold
                const css_percentage = 0.2, css_min = 200, css_max = 300; //menu1 class
                const percent = window.innerWidth*css_percentage;

                if (percent < css_min) width = window.innerWidth - css_min;
                else if (percent > css_max) width = window.innerWidth - css_max;
                else width = window.innerWidth*(1-css_percentage);
            }
            setScheduleSVG(renderScheduleSVG(width, window.innerHeight-4, schedule));
        }

        update();
        window.addEventListener("resize", update);

    }, [schedule]);

    function renderScheduleSVG(width, height, schedule){
        const marginx_right = 5, marginx_left = 9000/width, marginy = 5; //percent
        const w = (100 - (marginx_left + marginx_right)), h = (100 - (2*marginy));

        const getX = (i) => {return (marginx_left + (i*w/5.0))}
        const getY = (i) => {return ((i*h/10.75) + marginy)}

        //const colors = ["#666A86", "#788AA3", "#92B6B1", "#B2C9AB", "#E8DDB5"] //slate palette

        return (
            <svg width={width} height={1.2*height}>

                {schedule != null && (<><g className={styles.avoid_hours}>
                    {schedule.avoid_hours.map((hours_list, i) => (<g key={"avoid-day-" + i}>
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
                    {schedule.classes.map((classSet, i) => (<g key={"class-set-" + i}>
                        {classSet.map((cl, j) => (<g key={"class-" + i + "-" + j}>
                            {cl.meeting_times.map(meeting_time => {
                                const x = getX(meeting_time.day) + 0.14, y = getY(meeting_time.start_time/12.0) + 0.08;
                                //style={{fill: colors[i % colors.length]}}
                                return (<g key={"class-" + i + "-" + j + "-day-" + meeting_time.day}>
                                <rect x={x + "%"} y={y + "%"} width={((w/5) - 0.14) + "%"} 
                                height={(getY(meeting_time.end_time/12.0) - y) + "%"} 
                                className={styles["palette-" + (i % 5)]} rx="6" ry="6" key={"class-" + cl.title + "-day-" + meeting_time.day}></rect>
                                
                                <g style={{fill: "#FFF"}} fontSize={width > 900 ? "13pt" : "8pt"}>
                                    <text x={(x+0.5) + "%"} y={(y+2.4) + "%"} fontWeight="bold">{cl.title}</text>
                                    <text x={(x+0.5) + "%"} y={(y+5) + "%"}>{(width > 590 ? "Section " : "") + cl.section + (width > 400 ? " (" + cl.type + ")" : "")}</text>
                                </g>
                                </g>)
                            })}
                        </g>))}
                    </g>))}
                </g>
                </>)}
            </svg>
        )
    }

    function submit(){
        if (loading) return;
        if (schedule == null || schedule.classes.length == 0) return;
        setLoading(true);
    }

    return(
        <>
        <Head>
            <link rel="icon" href="/favicon.png"></link>
            <title>Free CU Boulder Class Schedule Optimizer | Make the most of your semester</title>
            <meta name="description" content="Cut down on your walking time and supercharge your sleep schedule with an optimized class schedule! Fit in all of your courses this year."></meta>
        </Head>
        <div className={styles.main_container}>
            <div className={styles.menu1}>
                <div className={styles.menu1_settings}>
                    Settings
                    <div style={{position: "absolute", bottom: "10px", fontSize: "12pt", width: "calc(100% - 20px)"}}>
                        <center>
                            <span><b>{status_message}</b></span>
                        </center>
                    </div>
                </div>
                <div className={styles.menu1_submit}>
                    {loading && (<div style={{marginTop: "6px", marginRight: "10px"}}>
                        <Image src="/loading.gif" width="32" height="32" alt="Loading"></Image>
                    </div>)}
                    <Button variant="contained" onClick={submit} style={{backgroundColor: "#CFB87C"}}>OPTIMIZE</Button>
                </div>
            </div>
            <div className={styles.schedule_container}>
                {schedule_svg}
            </div>
        </div>
        </>
    );
}