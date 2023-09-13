
import Head from "next/head.js";
import { CUtoModelTime, ModelToCUTime, getPreScheduleClass } from "lib/cu_utils.js";
import { useState, useEffect } from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Chip from "@mui/material/Chip";
import styles from "styles/Main.module.css";
import Image from "next/image";
import { preschedule_json } from "lib/json/preschedule.js";
import { example_schedule } from "lib/json/example_schedule.js";
import {renderScheduleSVG} from "lib/utils.js";
import { lookup_map } from "lib/json/lookup_map.js";
import { name_map } from "lib/json/name_map.js";

export async function getServerSideProps(context){
    return {
        props: {
            context: {
                cors_anywhere: process.env.CORS_ANYWHERE,
            }
        }
    }
}

export default function Index({context}) {

    const [schedule_svg, setScheduleSVG] = useState(null);
    const [loading, setLoading] = useState(false);
    const [status_message, setStatusText] = useState("Brought to you by a fellow Buff!");
    const [preschedule, setPreSchedule] = useState([]);
    const [schedule, setSchedule] = useState({
        classes: [],
        avoid_times: [[], [], [], [], []]
    });
    const [class_suggestions, setClassSuggestions] = useState([]);

    useEffect(() => {
        if (typeof window == "undefined") return;

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
        document.onkeydown = async (e) => {
            if (e.keyCode == 13){ //enter
                const textinput = document.getElementById("class-search").value;
                addPrescheduleClass(textinput);
            }
        }

        const search_box = document.getElementById("class-search");
        const searchBoxType = (e) => {
            const t = e.target.value;
            const suggestions = [];
            if (t.length == 0) return;

            const word_split = t.split(" ");

            if (word_split.length >= 2){
                const code = (word_split[0] + " " + word_split[1]).toUpperCase().replace(":", "");
                if (name_map[code] != undefined) suggestions.push(code);
            }

            for (let i = 0; i < word_split.length; i++){
                const word = word_split[i].toLowerCase();
                if (word.length > 3){
                    const res = lookup_map[word];
                    if (res != undefined) {
                        for (let j = 0; j < res.length; j++) if (!suggestions.includes(res[j])) suggestions.push(res[j]);
                    }
                    if (word.charAt(word.length-1) != "s"){
                        const res2 = lookup_map[word + "s"];
                        if (res2 != undefined){
                            for (let j = 0; j < res2.length; j++) if (!suggestions.includes(res2[j])) suggestions.push(res2[j]);
                        }
                    }
                }
            }

            setClassSuggestions(suggestions);
        }
        search_box.addEventListener("input", searchBoxType);

        return () => {
            window.removeEventListener("resize", update);
            search_box.removeEventListener("input", searchBoxType);
        }

    }, [schedule, context]);

    async function addPrescheduleClass(class_code, from_suggestion){
        if (class_code.length == 0 || loading) return;
        const spl = class_code.split(" ");
        if (spl.length != 2 || spl[0].length != 4 || spl[1].length != 4) return; //class code format (ex. CSCI 1000)

        setClassSuggestions([]);
        setLoading(true);

        const preschedule_add = await getPreScheduleClass(class_code.toUpperCase(), context.cors_anywhere);
        console.log(preschedule_add);
        if (preschedule_add == null) return;
        
        for (let i = 0; i < preschedule_add.length; i++){
            preschedule.push(preschedule_add[i]);
        }
        setPreSchedule(preschedule);
        setLoading(false);
        document.getElementById("class-search").value = "";

    }

    async function submit(){
        if (loading) return;
        if (preschedule == null || preschedule.length == 0) return;
        setLoading(true);

        console.log(preschedule);

        const res1 = await fetch("/api/optimizer", {
            method: "POST",
            body: JSON.stringify({
                current_schedule: schedule,
                preschedule,
                min_enroll_count: preschedule.length,
            })
        });
        const res = await res1.json();
        setLoading(false);

        if (res1.status == 200 && res.final_schedule != undefined){
            const s = {classes: res.final_schedule};
            s.avoid_times = schedule.avoid_times;
            setSchedule(s);
            setStatusText("✅ Created optimal schedule");
        } else {
            console.error(res);
            setStatusText("❌ There was an error!");
        }
    }
    
    return(
        <>
        <Head>
            <link rel="icon" href="/favicon.png"></link>
            <title>CU Boulder Class Schedule Optimizer | Make the most of your semester for Free!</title>
            <meta name="description" content="Cut down on your walking time and supercharge your sleep schedule with an optimized class schedule! Fit in all of your courses this year."></meta>
        </Head>
        <div className={styles.main_container}>
            <div className={styles.menu1}>
                <div className={styles.menu1_settings}>
                    <TextField fullWidth label="Enter your classes" sx={{input: {color: "white", background: "#37373f"}}} id="class-search"></TextField>
                    
                    {class_suggestions.length > 0 && (<div className={styles.class_suggestions}>
                        {class_suggestions.map((cs, i) => (
                            <div className={styles.class_suggestion + " " + (i % 2 == 0 ? styles.class_suggestion_a : styles.class_suggestion_b)} onClick={() => addPrescheduleClass(cs)} key={"class-suggestion-" + i}>
                                {cs + ": " + (name_map[cs] || "No Description")}
                            </div>
                        ))}
                    </div>)}

                    <div className={styles.class_list_chips}>
                            {preschedule.map((cl, i) => (
                                <div style={{margin: "5px"}} key={"class-chip-" + i}>
                                    <Chip label={cl.title + " (" + cl.type + ")"} variant="filled" onDelete={() => {
                                        
                                        setPreSchedule(preschedule.filter(e => (e.title != cl.title) && (e.type != cl.type)));
                                    }} style={{backgroundColor: "#e2e2e2"}}></Chip>
                                </div>
                            ))}
                            {preschedule.length == 0 && (<div style={{paddingLeft: "5px"}}>
                                <span style={{fontSize: "8pt", color: "rgba(255, 255, 255, 0.50)"}}>Search your classes to begin</span>
                            </div>)}
                    </div>
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
                    <Button variant={loading ? "disabled" : "contained"} onClick={submit} style={{backgroundColor: "#CFB87C"}}>OPTIMIZE</Button>
                </div>
            </div>
            <div className={styles.schedule_container}>
                {schedule_svg}
            </div>
        </div>
        </>
    );
}