import { getPreScheduleClass } from "../../lib/cu_utils";


export default async function handler(req, res){

    if (req.query.name == undefined) {
        res.status(406).json({error_msg: "Missing 'name' parameter!"});
        return;
    }

    const res1 = await getPreScheduleClass(req.query.name, "");

    res.status(200).json(res1);

}