import solver from "javascript-lp-solver/src/solver";


export default async function handler(req, res){
    var model = {
        "optimize": ["cost", "proximity_y"], //cost can involve unpreferred hours, waitlist, bad professors, etc.
        "opType": "min",
        "constraints":{
            "d0-t0": {"min": 0, "max": 1},
            "d0-t1": {"min": 0, "max": 1},
            "d0-t2": {"min": 0, "max": 1},
            "c0-enrolled": {"min": 0, "max": 1},
            "c1-enrolled": {"min": 0, "max": 1},
            "c2-enrolled": {"min": 0, "max": 1},
            "enrolled-count": {"min": 2, "max": 2},
        },
        "variables":{
            "c0-d0-t0": {"enrolled-count": 1, "d0-t0": 1, "d0-t1": 1, "c0-enrolled": 1, "cost": 0 + Math.random()},
            "c0-d0-t1": {"enrolled-count": 1, "d0-t1": 1, "d0-t2": 1, "c0-enrolled": 1, "cost": 0 + Math.random()},
            "c0-d0-t2": {"enrolled-count": 1, "d0-t2": 1, "c0-enrolled": 1, "cost": 1 + Math.random()},
            "c1-d0-t0": {"enrolled-count": 1, "d0-t0": 1, "c1-enrolled": 1, "cost": 0 + Math.random()},
            "c1-d0-t1": {"enrolled-count": 1, "d0-t1": 1, "c1-enrolled": 1, "cost": 0 + Math.random()},
            "c1-d0-t2": {"enrolled-count": 1, "d0-t2": 1, "c1-enrolled": 1, "cost": 1 + Math.random()},
            "c2-d0-t0": {"enrolled-count": 1, "d0-t0": 1, "c2-enrolled": 1, "cost": 0 + Math.random()},
            "c2-d0-t1": {"enrolled-count": 1, "d0-t1": 1, "c2-enrolled": 1, "cost": 0 + Math.random()},
            "c2-d0-t2": {"enrolled-count": 1, "d0-t2": 1, "c2-enrolled": 1, "cost": 1 + Math.random()}, //c1 and c2 are quarter long classes
        }, 
        "ints": {
            "c0-d0-t0": 1, "c0-d0-t1": 1, "c0-d0-t2": 1,
            "c1-d0-t0": 1, "c1-d0-t1": 1, "c1-d0-t2": 1,
            "c2-d0-t0": 1, "c2-d0-t1": 1, "c2-d0-t2": 1,
        }
    }

    const start = (new Date()).getTime();
    var f = solver.Solve(model)
    console.log("Took " + ((new Date()).getTime() - start) + "ms");
    res.status(200).json(f)
}