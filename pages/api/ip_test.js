

export default async function handler(req, res){
    const r = await fetch("https://api.ipify.org?format=json"); //128.138.65.204
    const r2 = await fetch(process.env.CORS_ANYWHERE + "https://api.ipify.org?format=json");

    res.status(200).json({r1: await r.json(), r2: await r2.text()});
}