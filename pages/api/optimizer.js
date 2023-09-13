import solver from "javascript-lp-solver/src/solver";
import { isRangeIntersection } from "lib/utils";

export function randomCost(i){ //basic seeded pseudorandom function
    return Math.random();
    //const n = Math.pow(i, 2)*(100/9.0)*Math.E;
    //return n - Math.trunc(n);
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
    if (preschedule.length > 20){
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
            const model_var = {enrolled_count: 1, cost: randomCost(cost_count + 8)}
            cost_count++;
            model_var["c" + i + "-enrolled"] = 1;

            if (offering.full && premium) model_var.cost += 10;

            if (offering.meeting_times == undefined || offering.meeting_times.length == 0){
                res.status(406).json({error_msg: "Class '" + title + "' offering #" + j + " does not define 'meeting_times'!"});
                return;
            }

            let conflicts_avoid_times = false;
            for (let k = 0; k < offering.meeting_times.length; k++){ //for each time class meets in the week
                const mtime = offering.meeting_times[k];
                if (mtime.day == undefined || mtime.day < 0 || mtime.day > 4 || mtime.start_time == undefined || mtime.end_time == undefined || mtime.start_time < 0 || mtime.start_time > 140-1 || mtime.end_time <= mtime.start_time || mtime.end_time > 140){
                    res.status(406).json({error_msg: "Malformatted meeting time in class '" + title + " offering " + j + " meeting time " + k + "! Check that the day, start_time, and end_time are correct."});
                    return;
                }

                if (isRangeIntersection([mtime.start_time, mtime.end_time], avoid_times[mtime.day])) conflicts_avoid_times = true;
                
                for (let time_itr = mtime.start_time; time_itr <= mtime.end_time + 1; time_itr++){ //every 5 min chunk in 1 class's meeting
                    model_var["d" + mtime.day + "-t" + time_itr] = 1; //model time (0-140), also books 5 mins after class ends
                    model.constraints["d" + mtime.day + "-t" + time_itr] = {min: 0, max: 1};
                }
            }

            if (conflicts_avoid_times) model_var.cost += 100;

            model.variables["c" + i + "-o" + j] = model_var;
            model.ints["c" + i + "-o" + j] = 1;
        }
    }

    
    //console.log(model);

    const start = (new Date()).getTime();
    const solved = solver.Solve(model)
    const duration = (new Date()).getTime() - start;
    console.log("duration = " + duration + "ms");

    const final_schedule = [], taken_ranges = [[], [], [], [], []];
    for (const [var_name, val] of Object.entries(solved)){
        const var_split = var_name.split("-");
        if (var_split.length == 2){ //class result
            const class_num = parseInt(var_split[0].substring(1)), offering_num = parseInt(var_split[1].substring(1));
            const add_class = preschedule[class_num].offerings[offering_num];

            add_class.title = preschedule[class_num].title;
            add_class.type = preschedule[class_num].type;

            let add = false;
            for (let i = 0; i < add_class.meeting_times.length; i++){
                const mtime = add_class.meeting_times[i];
                if (solved.feasible || !isRangeIntersection([mtime.start_time, mtime.end_time], taken_ranges[mtime.day])){
                    add = true;
                    taken_ranges[mtime.day].push([mtime.start_time, mtime.end_time]);
                } else break;
            }

            if (add) final_schedule.push(add_class);
        }
    }

    res.status(200).json({conflictions: solved.feasible ? 0 : min_enroll_count - final_schedule.length, final_schedule});
}