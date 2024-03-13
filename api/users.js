import { Router } from "express";

import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User, { getUserById, getUserByUsername, validateUser } from "../models/user.js";
import { generateAuthToken, requireAuthentication } from "../lib/auth.js";

const router = Router();

router.post('/', requireAuthentication, async function (req, res) {
    if (req.userId) {
        const loggedInUser = await User.findOne({ _id: req.userId });
        if(!loggedInUser) {
            return res.status(404).json({
                error: "Your account no longer exists"
            })
        }
        if(!loggedInUser.admin) {
            return res.status(403).json({
                error: "You do not have access to add new users"
            })
        }
        console.log(loggedInUser)
        const existingUser = await User.findOne({ username: req.body.username});
        console.log(existingUser);
        if (existingUser) {
            return res.status(403).json({
                error: `You can't create an already existing user with username: ${req.body.username}`
            });
        }
        const user = new User(req.body);
        var error = user.validateSync();
        if (error) {
            res.status(400).json({
                error: error
            });
            return;
        }
        const hash = await bcrypt.hash(user.password, 8)
        user.password = hash
        console.log(user)
        user.save().then(insertedUser => {
            res.status(201).json({
                id: insertedUser._id,
                links: {
                    user: `/users/${insertedUser.username}`
                }
            });
        }).catch(err => {
            res.status(400).json({
                error: err
            });
        });
        
    }
    else {
        res.status(403).json({
            error: "Unauthorized to create a user"
        });
    }
});

router.delete('/:id', requireAuthentication, async function (req, res, next) {
    if(!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(401).json({ 
            error: "Invalid user id" 
        });
    }
    if(!req.userId) {
        return res.status(403).json({
            error: "You are not logged in"
        })
    }
    const loggedInUser = await User.findOne({ _id: req.userId });
    if(!loggedInUser) {
        return res.status(404).json({
            error: "Account no longer exists"
        })
    }
    if(!loggedInUser.admin) {
        return res.status(403).json({
            error: "You do not have access to delete users"
        })
    }
    if(req.userId == req.params.id) {
        return res.status(403).json({
            error: `You cannot delete yourself.`
        });
    }
    const user = await User.findOne({ _id: req.params.id});
    if (!user) {
        return res.status(404).json({
            error: `User with id: ${req.params.id} not found`
        });
    }
    User.findByIdAndDelete(req.params.id).then(async () => {
        return res.status(200).json({
            msg: `Successfully deleted user with id ${req.params.id}`
        })
    }).catch((err) => {
        res.status(400).json({ error: err.message });
    });
});


router.patch('/:id', requireAuthentication, async function (req, res, next) {
    if(!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(401).json({ 
            error: "Invalid user id" 
        });
    }
    if(!req.userId) {
        return res.status(403).json({
            error: "You are not logged in"
        })
    }
    const loggedInUser = await User.findOne({ _id: req.userId });
    if(!loggedInUser) {
        return res.status(404).json({
            error: "Account no longer exists"
        })
    }
    if(req.userId != req.params.id && !loggedInUser.admin) {   
        return res.status(403).json({
            error: "You do not have access to update other users"
        })
    }
    const user = await User.findOne({ _id: req.params.id});
    if (!user) {
        return res.status(404).json({
            error: `User with id: ${req.params.id} not found`
        });
    }
    if (req.body.id) {
        return res.status(403).json({
            error: "You cannot change the user id"
        });
    }
    if (req.body.username) {
        if(req.body.username !== user.username) {
            return res.status(403).json({
                error: "You cannot change the username"
            });
        }
    }
    if (req.body.admin && !loggedInUser.admin) {
        return res.status(403).json({
            error: "You cannot change the admin status" 
        });
    }
    if (req.body.password) {
        const hash = await bcrypt.hash(req.body.password, 8)
        req.body.password = hash
    }
    User.findByIdAndUpdate(req.params.id, req.body, { new: true }).then((updatedUser) => {
        if (updatedUser) {
            return res.status(200).json(updatedUser);
        }
        return res.status(404).json({
            error: `User with id: ${req.params.id} not found`
        })
    }).catch((err) => {
        res.status(400).json({ error: err.message })
    })    
})


router.post('/auth', async function (req, res, next) {
    if (req.body && req.body.username && req.body.password) {
        try {
            const user = await getUserByUsername(req.body.username, true)
            const authenticated = await validateUser(user, req.body.password)
            if (authenticated) {
                console.log(user)
                const token = generateAuthToken(user.id)
                res.status(200).send({
                    token: token
                })
            } else {
                res.status(401).send({
                    error: "Invalid authentication credentials"
                })
            }
        } catch (e) {
            next(e)
        }
    } else {
        res.status(400).send({
            error: "Request body requires `username` and `password`."
        })
    }
})

router.get('/:id', requireAuthentication, async function (req, res, next) {
    if(!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(401).json({ 
            error: "Invalid user id" 
        });
    }
    if(!req.userId) {
        return res.status(403).json({
            error: "You are not logged in"
        })
    }
    const loggedInUser = await User.findOne({ _id: req.userId });
    if(!loggedInUser) {
        return res.status(404).json({
            error: "Account no longer exists"
        })
    }
    if (req.userId === req.params.id || loggedInUser.admin) {
        const user = await getUserById(req.params.id, false)
        if (user) {
            return res.status(200).json(user)
        }
        return res.status(404).json({
            error: `User with id: ${req.params.id} not found`
        })
        
    }
    return res.status(403).send({
        err: "Unauthorized to get user account info"
    })
})

router.get('/name/:username', requireAuthentication, async function (req, res, next) {
    if(!req.userId) {
        return res.status(403).json({
            error: "You are not logged in"
        })
    }
    const loggedInUser = await User.findOne({ _id: req.userId });
    if(!loggedInUser) {
        return res.status(404).json({
            error: "Account no longer exists"
        })
    }

    if (loggedInUser.username === req.params.username || loggedInUser.admin) {
        const user = await getUserByUsername(req.params.username, false)
        if (user) {
            return res.status(200).json(user)
        }
        return res.status(404).json({
            error: `User with username: ${req.params.username} not found`
        })
    }
    return res.status(403).send({
        err: "Unauthorized to get user account info"
    })
})

export default router;
