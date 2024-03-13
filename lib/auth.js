import jwt from "jsonwebtoken"
const secretKey = "SuperSecret"

export function generateAuthToken(userId) {
    const payload = { sub: userId }
    return jwt.sign(payload, secretKey, { expiresIn: "24h" })
}

export function requireAuthentication(req, res, next) {
    console.log("== requireAuthentication()")
    const authHeader = req.get("Authorization") || ""
    const authHeaderParts = authHeader.split(" ")
    const token = authHeaderParts[0] === "Bearer" ?
        authHeaderParts[1] : null
    console.log("  -- token:", token)
    try {
        const payload = jwt.verify(token, secretKey)
        console.log("  -- payload:", payload)
        req.userId = payload.sub
        next()
    } catch (err) {
        console.error("== Error verifying token:", err)
        res.status(401).send({
            error: "Invalid authentication token"
        })
    }
}