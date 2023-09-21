import { isRangeIntersection, isSameSchedule } from "lib/utils";
import solver from "javascript-lp-solver/src/solver";
import { example_schedule, example_schedule2 } from "../../lib/json/example_schedule";
import { MAX_MODEL_TIME } from "../../lib/json/consts";

export function randomCost(i){ //basic seeded pseudorandom function
    const n = Math.pow(i + 8, 2)*(100/9.0)*Math.E;
    return n - Math.trunc(n);
}

export async function solve(model, preschedule, random_itr){

    //add random noise to costs
    let random_itr2 = 0;
    for (const [var_name, val] of Object.entries(model.variables)){
        model.variables[var_name].cost = model.variables[var_name].cost_orig + randomCost(random_itr + random_itr2);
        random_itr2++;
    }

    //console.log(model);

    const solved = solver.Solve(model)

    const final_schedule = [], taken_ranges = [[], [], [], [], []], added_classes = [];
    for (const [var_name, val] of Object.entries(solved)){
        const var_split = var_name.split("-");
        if (var_split.length == 2){ //class result
            const class_num = parseInt(var_split[0].substring(1)), offering_num = parseInt(var_split[1].substring(1));
            const add_class = preschedule[class_num].offerings[offering_num];

            add_class.title = preschedule[class_num].title;
            add_class.type = preschedule[class_num].type;
            
            let add = add_class.meeting_times.length == 0;
            for (let i = 0; i < add_class.meeting_times.length; i++){
                const mtime = add_class.meeting_times[i];
                if (solved.feasible || (!added_classes.includes(add_class.title + " " + add_class.type) && !isRangeIntersection([mtime.start_time, mtime.end_time], taken_ranges[mtime.day]))){
                    add = true;
                    taken_ranges[mtime.day].push([mtime.start_time, mtime.end_time]);
                    added_classes.push(add_class.title + " " + add_class.type);
                } else break;
            }

            if (add) final_schedule.push(add_class);
        }
    }

    return {feasible: solved.feasible, classes: final_schedule}
}

export default async function handler(req, res){
    if (req.method != "POST"){
        res.status(405).json({error_msg: "Must be 'POST' method!"});
        return;
    }

    if (req.body == undefined || req.body == ""){
        res.status(406).json({error_msg: "Missing request body"});
        return;
    }

    var data = null;
    try {
        data = JSON.parse(req.body);
    } catch (ex){
        res.status(406).json({error_msg: "Invalid JSON format for request body"});
        return;
    }

    if (data.current_schedule == undefined || data.preschedule == undefined || data.current_schedule.avoid_times == undefined) {
        res.status(406).json({error_msg: "Body must contain 'current_schedule', 'current_schedule.avoid_times', and 'preschedule'!"});
        return;
    }
    const avoid_times = data.current_schedule.avoid_times, preschedule = data.preschedule;
    if (avoid_times.length != 5){
        res.status(406).json({error_msg: "Malformatted avoid_times: Must have an entry for each day."});
        return;
    }
    let avoid_total = 0;
    for (let i = 0; i < avoid_times.length; i++){
        avoid_total += avoid_times[i].length;
        if (avoid_total > 20){
            res.status(406).json({error_msg: "Exceeded the maximum number of avoid time ranges!"});
            return;
        }
    }
    if (preschedule.length > 12){
        res.status(406).json({error_msg: "Exceeded the maximum number of classes!"});
        return;
    }
    if (preschedule.length == 0){
        res.status(406).json({error_msg: "Preschedule is empty."});
        return;
    }

    const premium = false;

    const min_enroll_count = data.min_enroll_count == undefined ? preschedule.length : Math.min(data.min_enroll_count, preschedule.length);
    const model = {
        optimize: "cost",
        opType: "min",
        constraints: {
            enrolled_count: {min: min_enroll_count, max: min_enroll_count}
        },
        variables: {},
        ints: {}
    }

    let cost_count = 0;
    for (let i = 0; i < preschedule.length; i++){ //each class to be scheduled
        if (preschedule[i].title == undefined || preschedule[i].offerings == undefined || preschedule[i].offerings.length == 0){
            res.status(406).json({error_msg: "Malformatted preschedule object (Index " + i + ")"});
            return;
        }
        const title = preschedule[i].title.toUpperCase();

        model.constraints["c" + i + "-enrolled"] = {min: 0, max: 1};

        for (let j = 0; j < Math.min(preschedule[i].offerings.length, 65); j++){ //each offering in class
            const offering = preschedule[i].offerings[j];
            const model_var = {enrolled_count: 1, cost: 0, cost_orig: 0}
            cost_count++;
            model_var["c" + i + "-enrolled"] = 1;

            if (offering.full && premium) model_var.cost_orig += 10;

            if (offering.meeting_times == undefined){ //if len 0, class is async
                res.status(406).json({error_msg: "Class '" + title + "' offering #" + j + " does not define 'meeting_times'!"});
                return;
            }

            let conflicts_avoid_times = false;
            for (let k = 0; k < offering.meeting_times.length; k++){ //for each time class meets in the week
                const mtime = offering.meeting_times[k];
                if (mtime.day == undefined || mtime.day < 0 || mtime.day > 4 || mtime.start_time == undefined || mtime.end_time == undefined || mtime.start_time < 0 || mtime.start_time > MAX_MODEL_TIME-1 || mtime.end_time <= mtime.start_time || mtime.end_time > MAX_MODEL_TIME){
                    res.status(406).json({error_msg: "Malformatted meeting time in class '" + title + " offering " + j + " meeting time " + k + "! Check that the day, start_time, and end_time are correct."});
                    return;
                }

                if (isRangeIntersection([mtime.start_time, mtime.end_time], avoid_times[mtime.day])) conflicts_avoid_times = true;
                
                for (let time_itr = mtime.start_time; time_itr <= mtime.end_time + 1; time_itr++){ //every 5 min chunk in 1 class's meeting
                    model_var["d" + mtime.day + "-t" + time_itr] = 1; //model time (0-MAX_MODEL_TIME), also books 5 mins after class ends
                    model.constraints["d" + mtime.day + "-t" + time_itr] = {min: 0, max: 1};
                }
            }

            if (conflicts_avoid_times) model_var.cost_orig += 100;

            model.variables["c" + i + "-o" + j] = model_var;
            model.ints["c" + i + "-o" + j] = 1;
        }
    }

    
    //console.log(model);

    const schedules = [], start = (new Date()).getTime();

    var random_itr = 0;
    while (schedules.length < 10 && random_itr < 20){
        const solved = await solve(model, preschedule, random_itr);

        var duplicate = false;

        for (let j = 0; j < schedules.length; j++){
            if (isSameSchedule(schedules[j], solved)) {
                duplicate = true;
                break;
            }
        }
        if (!duplicate){
            if (!solved.feasible) console.log("INFEASIBLE");
            schedules.push(solved);
        }
        random_itr++;
    }

    console.log("Took " + ((new Date()).getTime() - start) + "ms");
    console.log(schedules.length + " unique schedules");

    //res.status(200).json({conflictions: solved.feasible ? 0 : min_enroll_count - solved.final_schedule.length, final_schedule: solved.final_schedule});
    res.status(200).json({conflictions: 0, schedule_count: schedules.length, schedules});
}