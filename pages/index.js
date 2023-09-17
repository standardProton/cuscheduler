
import Head from "next/head.js";
import { CUtoModelTime, ModelToCUTime, getPreScheduleClass } from "lib/cu_utils.js";
import { useState, useEffect } from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import Chip from "@mui/material/Chip";
import Select from "@mui/material/Select";
import styles from "styles/Main.module.css";
import Image from "next/image";
import { preschedule_json } from "lib/json/preschedule.js";
import { example_schedule } from "lib/json/example_schedule.js";
import {renderScheduleSVG, isRangeIntersectionSingle, timeString } from "lib/utils.js";
import { lookup_map } from "lib/json/lookup_map.js";
import { name_map } from "lib/json/name_map.js";
import { Card, Box, CardContent, MenuItem, CardActionArea, Typography, Grid, FormHelperText } from "@mui/material";
import { MAX_MODEL_TIME } from "../lib/json/consts";
import React from "react";

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
    const [color_key, setColorKey] = useState({});
    const [ut_create0, setUTCreatorStart] = useState(null);
    const [ut_create1, setUTCreatorEnd] = useState(null);

    //get this outta here
    const [ut_days, setSelectUnavailableDays] = useState([-1]);
    const [ut_start, setUnavailableStart] = useState(null);
    const [ut_start_input, setUnavailableStartInput] = useState({"$H": 8, "$m": 0});
    const [ut_end, setUnavailableEnd] = useState(null);
    const [ut_end_input, setUnavailableEndInput] = useState({"$H": 9, "$m": 0});

    useEffect(() => {
        if (typeof window == "undefined") return;

        function update(){
            var width = window.innerWidth;
            if (window.innerWidth > 650) { //update with phone threshold
                const css_percentage = 0.23, css_min = 200, css_max = 350; //menu1 class
                const percent = window.innerWidth*css_percentage;
    
                if (percent < css_min) width = window.innerWidth - css_min;
                else if (percent > css_max) width = window.innerWidth - css_max;
                else width = window.innerWidth*(1-css_percentage);
            }

            const options = {
                ut_start: ut_create0,
                ut_end: ut_create1
            }

            console.log(options);
    
            //console.log("Update");
            setScheduleSVG(renderScheduleSVG(width, window.innerHeight-4, schedule, color_key, setColorKey, scheduleClick, scheduleHover, options));
        }

        update();
        window.addEventListener("resize", update);
        document.onkeydown = async (e) => {
            if (e.keyCode == 13){ //enter
                const textinput = document.getElementById("class-search").value;
                addPrescheduleClass(textinput);
            }
            else if (e.keyCode == 27){
                setUTCreatorStart(null);
                setUTCreatorEnd(null);
            }
        }

        const search_box = document.getElementById("class-search");
        const searchBoxType = (e) => {
            const t = e.target.value;
            const suggestions = [];
            if (t.length == 0) {
                setClassSuggestions([]);
                return;
            }

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
                        for (let j = 0; j < res.length; j++) {
                            var add = true;
                                if (!suggestions.includes(res[j])){
                                for (let k = 0; k < word_split.length; k++){
                                    if (i != k && !name_map[res[j]].toLowerCase().includes(word_split[k].toLowerCase())) {
                                        add = false;
                                        break;
                                    }
                                }
                                if (add) suggestions.push(res[j]);
                            }
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

    }, [schedule, preschedule, ut_create0, ut_create1, context]);

    function scheduleClick(day, time){
        if (ut_create0 == null){
            setUTCreatorStart([day, time]);
        } else if (ut_create1 != null) {
            const avoid_times = schedule.avoid_times;
            for (let i = Math.min(ut_create0[0], ut_create1[0]); i <= Math.max(ut_create0[0], ut_create1[0]); i++){
                var add_new = true;
                const new_ut = [Math.min(ut_create0[1], ut_create1[1]), Math.max(ut_create0[1], ut_create1[1])];
                const day = i;
                console.log("i = " + i);

                if (day > 4) continue;

                for (let j = 0; j < avoid_times[day].length; j++){
                    const existing_ut = avoid_times[day][j];
                    if (isRangeIntersectionSingle(new_ut, existing_ut)){
                        if (new_ut[0] < existing_ut[0]) {
                            existing_ut[0] = new_ut[0];
                            add_new = false;
                        }
                        if (new_ut[1] > existing_ut[1]){
                            existing_ut[1] = new_ut[1];
                            add_new = false;
                        }
                        if (new_ut[0] > existing_ut[0] && new_ut[1] < existing_ut[1]) add_new = false;
                        if (!add_new) break;
                    }
                }
                //console.log("day = " + ut_days[i] + ", uts = " + ut_start + ", ute = " + ut_end + ", add_new = " + add_new);
                if (add_new) avoid_times[day].push(new_ut);
            }

            //console.log("avoid times:");
            //console.log(schedule.avoid_times);
            setUTCreatorStart(null);
            setUTCreatorEnd(null);
            //setSelectUnavailableDays([-1]);
            setSchedule({classes: schedule.classes, avoid_times});
        }
    }
    function scheduleHover(day, time){
        if (ut_create0 != null){
            setUTCreatorEnd([day, time]);
        }
    }

    async function addPrescheduleClass(class_code){
        if (class_code.length == 0 || loading) return;
        const spl = class_code.split(" ");
        if (spl.length != 2 || spl[0].length != 4 || spl[1].length != 4) return; //class code format (ex. CSCI 1000)

        setClassSuggestions([]);
        setLoading(true);

        const preschedule_add = await getPreScheduleClass(class_code.toUpperCase(), context.cors_anywhere);
        if (preschedule_add != null) {
            for (let i = 0; i < preschedule_add.length; i++){
                var add = true;
                for (let j = 0; j < preschedule.length; j++){
                    if (preschedule[j].title == preschedule_add[i].title && preschedule[j].type == preschedule_add[i].type){
                        add = false;
                        break;
                    }
                }
                if (add) preschedule.push(preschedule_add[i]);
            }
        } else {
            setStatusText("Could not find this class!");
        }

        setPreSchedule(preschedule);
        //update(window, preschedule);
        setLoading(false);
        document.getElementById("class-search").value = "";

    }

    function removePrescheduleClass(cl){
        const nps = [];
        for (let j = 0; j < preschedule.length; j++) {
            if (preschedule[j].title != cl.title || preschedule[j].type != cl.type) nps.push(preschedule[j]);
        }
        delete color_key[cl.title];
        setColorKey(color_key);
        setPreSchedule(nps);
    }

    async function submit(){
        if (loading) return;
        if (preschedule == null || preschedule.length == 0) return;
        setLoading(true);

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

        if (res1.status == 200 && res.schedules != undefined){
            const s = {classes: res.schedules[0].classes};
            s.avoid_times = schedule.avoid_times;
            setSchedule(s);

            if (res.conflictions == 0) setStatusText("✅ Created schedule");
            else setStatusText("❌ Could not fit " + res.conflictions + " class" + (res.conflictions == 1 ? "" : "es") + " into schedule!")
        } else {
            console.error(res.error_msg);
            setStatusText("❌ There was an error!");
        }
    }
    
    return(
        <>
        <Head>
            <link rel="icon" href="/favicon.png"></link>
            <title>#1 CU Boulder Schedule Builder | Make Your Schedule Perfect in only 60 Seconds</title>
            <meta name="description" content="Cut down on stress and supercharge your sleep schedule with an optimized class schedule! Fit your courses around your work schedule and personal time."></meta>
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
                    <div style={{marginTop: "15px"}}>
                        <Card style={{background: "#37373f"}}>
                            <CardContent>
                                <div style={{display: "flex", flexWrap: "wrap"}}>
                                {preschedule.map((cl, i) => (
                                    <Chip key={"class-chip-" + i} label={cl.title+ " " + cl.type} variant="filled" onDelete={() => removePrescheduleClass(cl)} className={styles.chip}></Chip>
                                ))}
                                {preschedule.length == 0 && (<div style={{paddingLeft: "5px"}}>
                                    <span style={{fontSize: "8pt", color: "rgba(255, 255, 255, 0.50)"}}>Search your classes to begin</span>
                                </div>)}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    <div style={{marginTop: "15px"}}>
                        <Card style={{backgroundColor: "#37373f", color: "#FFF", padding: "10px"}}>
                            <Typography style={{marginBottom: "7px"}}>Unavailable Times</Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <TimePicker value={ut_start_input} onChange={(e) => {
                                        const hour = e["$H"], min = e["$m"];
                                        if (hour == undefined || min == undefined){
                                            console.error("Could not retrieve time value!");
                                            return;
                                        }
                                        var model_time = ((hour-8)*12) + (min/5.0);
                                        if (model_time < 0) model_time = 0;
                                        else if (model_time > MAX_MODEL_TIME) model_time = MAX_MODEL_TIME;

                                        setUnavailableStart(model_time);
                                    }} label="Start Time" minutesStep={5} sx={{input: {color: "white", background: "#37373f"}}} components={{OpenPickerIcon: "null"}}></TimePicker>
                                </Grid>
                                <Grid item xs={6}>
                                    <TimePicker value={ut_end_input} onChange={(e) => {
                                        console.log(e);
                                        const hour = e["$H"], min = e["$m"];
                                        if (hour == undefined || min == undefined){
                                            console.error("Could not retrieve time value!");
                                            return;
                                        }
                                        var model_time = ((hour-8)*12) + (min/5.0);
                                        if (model_time < 0) model_time = 0;
                                        else if (model_time > MAX_MODEL_TIME) model_time = MAX_MODEL_TIME;
                                        
                                        console.log("update time 2");
                                        setUnavailableEnd(model_time);
                                    }} minutesStep={5} label="End Time" sx={{input: {color: "white", background: "#37373f"}}} components={{OpenPickerIcon: "null"}}></TimePicker>
                                </Grid>
                                <Grid item xs={8}>
                                    <Select value={ut_days} onChange={(e) => {
                                        const nv = e.target.value.filter(j => j != -1);
                                        if (nv.length == 0) nv.push(-1);
                                        setSelectUnavailableDays(nv);
                                    }} required id="unavailable-day" multiple={true} sx={{color: "white", background: "#37373f", minWidth: "100%", maxWidth: "100%", height: "40px"}}>
                                        <MenuItem value={-1}>Select Days:</MenuItem>
                                        <MenuItem value={0}>M</MenuItem>
                                        <MenuItem value={1}>T</MenuItem>
                                        <MenuItem value={2}>W</MenuItem>
                                        <MenuItem value={3}>Th</MenuItem>
                                        <MenuItem value={4}>F</MenuItem>
                                    </Select>
                                </Grid>
                                <Grid item xs={4}>
                                    <Box>
                                        <center>
                                            <Button variant="contained" style={{backgroundColor: "#CFB87C"}} onClick={() => {
                                                console.log("ut_start = " + ut_start + ", ut_end = " + ut_end + " ut_days = " + JSON.stringify(ut_days));
                                                if (ut_start == null || isNaN(ut_start) || ut_end == null || isNaN(ut_end) || ut_start == ut_end) return;
                                                if (ut_days == null || ut_days.length == 0 || ut_days.includes(-1)) return;

                                                const avoid_times = schedule.avoid_times;
                                                for (let i = 0; i < ut_days.length; i++){
                                                    var add_new = true;
                                                    const new_ut = (ut_start < ut_end) ? [ut_start, ut_end] : [ut_end, ut_start];
                                                    for (let j = 0; j < avoid_times[ut_days[i]].length; j++){
                                                        const existing_ut = avoid_times[ut_days[i]][j];
                                                        if (isRangeIntersectionSingle(new_ut, existing_ut)){
                                                            if (new_ut[0] < existing_ut[0]) {
                                                                existing_ut[0] = new_ut[0];
                                                                add_new = false;
                                                            }
                                                            if (new_ut[1] > existing_ut[1]){
                                                                existing_ut[1] = new_ut[1];
                                                                add_new = false;
                                                            }
                                                            if (!add_new) break;
                                                        }
                                                    }
                                                    console.log("day = " + ut_days[i] + ", uts = " + ut_start + ", ute = " + ut_end + ", add_new = " + add_new);
                                                    if (add_new) avoid_times[ut_days[i]].push(new_ut);
                                                }

                                                //setUnavailableStart(null);
                                                //setUnavailableEnd(null);
                                                console.log("avoid times:");
                                                console.log(schedule.avoid_times);
                                                setSelectUnavailableDays([-1]);
                                                setSchedule({classes: schedule.classes, avoid_times});
                                            }}>Add</Button>
                                        </center>
                                    </Box>
                                </Grid>
                            </Grid>
                            <div style={{display: "flex", flexWrap: "wrap", marginTop: "8px"}}>
                                {schedule.avoid_times.map((ut_set, day) => (
                                    <React.Fragment key={"ut-chip-day-" + day}>
                                        {ut_set.map((ut, i) => (
                                            <Chip label={timeString(day, ut[0], ut[1])} key={"ut-chip-" + i} variant="filled" onDelete={()=> {}} className={styles.chip}></Chip>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </div>
                        </Card>
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