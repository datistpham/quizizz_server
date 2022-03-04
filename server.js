import express from 'express'
import { Server } from 'socket.io'
import mysql from 'mysql'
import cors from 'cors'
import http from 'http'
import cookieParser from 'cookie-parser'
import bodyParser from 'body-parser'
import { v4 as uuidv4 } from 'uuid'
import randomstring from 'randomstring'
import Cookies from 'universal-cookie';

const cookies = new Cookies()

const app = express()
const server = http.createServer(app)
const io = new Server(server)
const route = express.Router()
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'quiz'
})
connection.connect()


app.use(cookieParser('cookies_account'))
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(route)


const sql= (state,user)=> {
    const exec= `UPDATE student set online='${state}' where id_unique='${user}'`
    connection.query(exec)
}

const user= {}
io.on('connection', (socket) => {
    
    // console.log('Co nguoi vua ket noi '+ socket.id)
    socket.on('online', (data)=> {
        sql('online',data)
    })
   
    socket.on("disconnect", ()=> {
        sql('offline','868546a5-c4e4-4512-b2ee-38e2b38d9bfd')
        // console.log('Co nguoi vua ngat ket noi '+ socket.id)
        delete user[socket.id]
        // console.log(user)
    })


})

route.get('/getidstring/', (req,res)=> {
    const sql= `SELECT id_string from student where id_unique='${req.query.user}'`
    connection.query(sql, (err, result)=> {
        if(err) {
            throw err
        }

        res.send(result)
    })
})

route.get('/listfriends', (req,res)=> {
    const sql= `SELECT firstName,surName,avatar,account,online from student where id_unique in (SELECT friends from info_about_student where id_string_user='${req.query.user}')`
    connection.query(sql, (err, result)=> {
        if(err) {
            throw err
        }
        res.send(result)
    })
    const sql2= `SELECT friends from info_about_student where id_string_user='${req.query.user}'`
    connection.query(sql2, (err,result)=> {
        console.log(result)
    })
})

route.get('/result_answer/summary/:id1/:id2', (req,res)=> {
    const sql= `SELECT * from ${req.params.id1}`
    connection.query(sql, (err,result)=> {
        if(err) {
            throw err
        }

        res.send(result)
    })
})

route.get('/list_answer/summary/:id1/:id2', (req,res)=> {
    const sql= `SELECT * from list_result_answer where id_user='${req.params.id2}' and id_question='${req.params.id1}'`
    connection.query(sql, (err,result)=> {
        if(err) {
            throw err
        }

        res.send(result)
    })
})

route.post('/signup', (req, res, next) => {
        if (req.body.firstName === '' || req.body.firstName === null || req.body.firstName === undefined ||
            req.body.surName === '' || req.body.surName === null || req.body.surName === undefined ||
            req.body.account === '' || req.body.account === null || req.body.account === undefined ||
            req.body.email === '' || req.body.email === null || req.body.email === undefined ||
            req.body.password === '' || req.body.password === null || req.body.password === undefined ||
            req.body.confirmPassword === '' || req.body.confirmPassword === null || req.body.confirmPassword === undefined

        ) {
            res.send('duplicate')
            return 
        } else {
            next()
        }
    },
    (req, res, next) => {
        if (req.body.password !== req.body.confirmPassword) {
            res.send('duplicate2')
            return
        } else {
            next()
        }
    },
    (req,res,next)=> {
        const sql= `SELECT email from student where email='${req.body.email}'`
        connection.query(sql, (err,result)=> {
            if(err) {
                throw err
            }
            if(result[0] !== null && result[0] !== undefined && result[0] !== []) {
                res.send('email exist')
                return 
            }
            else {
                next()
            }
        })
    }
    ,
    (req, res) => {
        const sql = `INSERT INTO student(id_unique,firstName,surName,email,account,password,id_randomstring) values('${uuidv4()}', '${req.body.firstName}', '${req.body.surName}','${req.body.email}','${req.body.account}','${req.body.password}', '${randomstring.generate()}' )`
        connection.query(sql, (err, result) => {
            if (err) {
                throw err
            }

            res.send('success')
        })
    }
)

route.get('/allfriends', (req,res)=> {
    // console.log(req.query.user)
    const sql= `SELECT friends from info_about_student where id_string_user='${req.query.user}'`
    connection.query(sql, (err,result)=> {
        if(err) {
            throw err
        }

        res.send(result)
    })
})

route.post('/login', (req, res, next) => {
        if (req.body.account === '' || req.body.account === null || req.body.account === undefined) {
            res.send('empty1')
            return
        } else {
            next()
        }
    },
    (req, res, next) => {
        if (req.body.password === '' || req.body.password === null || req.body.password === undefined) {
            res.send('empty2')
            return
        } else {
            next()
        }
    }

    , (req, res) => {

        console.log(req.body.account + req.body.password)
        const sql = `SELECT account,password,id_unique from student where account='${req.body.account}' and password='${req.body.password}'`
        connection.query(sql, (err, result) => {
            if (err) {
                throw err
            }
            if(result[0] !== null && result[0] !== undefined && result[0] !== []) {
                res.send(result)
                return 
            }
            res.send('not exist')
            return 
        })
    })



route.get('/subjects/:topics', (req, res) => {
    const sql = `SELECT id,topic,image,question,summary,accuracy,number_of_users,id_questions from topics where topic='${req.params.topics}' limit 5`
    connection.query(sql, (err, result) => {
        if (err) {
            throw err
        }
        res.send(result)
    })
})
    
route.post('/gettopic/:id', (req, res) => {
    if (req.params.id != undefined || req.param.id != null ) {
        const sql = `SELECT image,topic,question,summary,id_questions,classify,level,author,number_of_users from topics where id=${req.params.id}`
        connection.query(sql, (err, result) => {
            if (err) {
                throw err
            }
            res.send(result)
        })

    } 
    else {
        res.send('Nope')
    }
})

route.post('/login/success', (req, res) => {
    const sql = `SELECT firstName,surName,account,id_unique,avatar,name_avatar,info_avatar,grade from student where id_unique='${req.body.cookies}'`
    connection.query(sql, (err, result) => {
        if (err) {
            throw err
        }
        res.send(result)

    })
})

route.get('/active-recently', (req,res)=> {
    const sql= `SELECT image,question, summary, percent_question, id_question, id_question2 from recently_active where id_user='${req.query.id_user}'`
    connection.query(sql, (err, result)=> {
        if(err) {
            throw err
        }
        res.send(result)
    })
})

route.get('/topics/all/:params', (req, res) => {
    const sql = `SELECT id,image,question,summary,accuracy,number_of_users,classify,level,id_questions from topics where topic='${req.params.params}' order by id asc limit 7`
    connection.query(sql, (err, result) => {
        if (err) {
            throw err
        }
        res.send(result)
    })
})

route.get('/restof/join/:params', (req, res) => {
    const sql = `SELECT count(topic)-7 from topics where topic='${req.params.params}'`
    connection.query(sql, (err, result) => {
        if (err) {
            throw err
        }
        (result.map(item => {
            const sql = `SELECT id,image,question,summary,accuracy,number_of_users,level,author,classify from topics where topic='${req.params.params}' order by id desc limit ${(item['count(topic)-7'])}`
            connection.query(sql, (err, result) => {
                if (err) {
                    throw err
                }
                res.send(result)
            })
        }))
    })
})

route.get('/storeavatar', (req, res) => {
    const sql = 'SELECT * from store_avatar order by id asc'
    connection.query(sql, (err, result) => {
        if (err) {
            throw err
        }

        res.send(result)
    })
})

route.get('/storeavatar/:id', (req, res) => {
    const sql = `SELECT * from store_avatar where id=${req.params.id}`
    connection.query(sql, (err, result) => {
        if (err) {
            throw err
        }

        res.send(result)
    })
})

route.get('/getid_question', (req, res) => {
    const sql = `SELECt id_questions from topics`
    connection.query(sql, (req, res) => {
        if (err) {
            throw err
        }
        res.send(result)
    })
})

route.post('/uploadavatar/:id_unique', (req, res) => {
    const sql = `Update student set avatar='${req.body.avatar}' where id_unique='${req.params.id_unique}'`
    connection.query(sql, (err) => {
        if (err) {
            throw err
        }
    })
    const sql1 = `Update student set name_avatar='${req.body.name_avatar}' where id_unique='${req.params.id_unique}'`
    connection.query(sql1, (err) => {
        if (err) {
            throw err
        }
    })


    const sql2 = `Update student set info_avatar='${req.body.info_avatar}' where id_unique='${req.params.id_unique}'`
    connection.query(sql2, (err) => {
        if (err) {
            throw err
        }
    })

})

route.post('/updateaccount/:oldaccount', (req, res) => {
    const sql = `UPDATE student set account='${req.body.account}' where id_unique='${req.params.oldaccount}'`
    connection.query(sql, (err, result) => {
        if (err) {
            throw err
        }
        res.send('success')
    })
})

route.post('/updateaccount1/:oldaccount', (req, res) => {
    const sql = `UPDATE student set firstName='${req.body.firstName}' where id_unique='${req.params.oldaccount}'`
    connection.query(sql, (err, result) => {
        if (err) {
            throw err
        }
    })
    const sql2 = `UPDATE student set surName='${req.body.surName}' where id_unique='${req.params.oldaccount}'`
    connection.query(sql2, (err, result) => {
        if (err) {
            throw err
        }
    })
})

route.post('/updateaccount2/:oldaccount', (req, res) => {
    const sql = `UPDATE student set grade='${req.body.grade}' where id_unique='${req.params.oldaccount}'`
    connection.query(sql, (err, result) => {
        if (err) {
            throw err
        }
        res.send('success')
    })
})
route.get('/users', (req, res) => {
    const sql = `SELECT email from student`
    connection.query(sql, (err, result) => {
        if (err) {
            throw err
        }
        let a = 0
        result.map(item => {
            if (req.query.name === item.email) {
                a = 1
            }

        })
        if (a === 1) {
            res.send('success')
        } else {
            res.send('failed')
        }
    })
})

route.get('/startgame/:id', (req, res) => {

    const sql = `SELECT image,question,summary,author from topics where id_questions='${req.params.id}'`
    connection.query(sql, (err, result) => {
        if (err) {
            throw err
        }

        res.send(result)
    })
})

route.get('/join/game/:id1/:id2', (req, res) => {
    // console.log(req.params.id1)
    // console.log(req.params.id2)
    // console.log(req.query.type)
    const sql = `SELECT question,choose1,choose2,choose3,choose4 from question where `
})

route.get('/number_of_questions/:id', (req, res) => {

    const sql = `SELECT Count(id) from ${req.params.id}`
    connection.query(sql, (err, result) => {
        if (err) {
            throw err
        }

        res.send(result)
    })

})

route.get('/number_of_questions/:id/:id2', (req, res) => {
    const sql1 = `SELECT COUNT(*) from ${req.params.id}`
    connection.query(sql1, (err, result) => {
        if (err) {
            throw err
        }
        if (result[0]['COUNT(*)'] < req.params.id2) {
            res.send('runout')
            return
        }
        const sql = `SELECT id,question,choose1,choose2,choose3,choose4 from ${req.params.id} where id=${req.params.id2}`
        connection.query(sql, (err, result) => {
            if (err) {
                throw err
            }
            res.send(result)
        })
    })

})

route.post('/checkanswer/:id1/:id2', (req, res) => {
    // console.log(req.body.question) // name question
    // console.log(req.params.id1) // question nth
    // console.log(req.params.id2) //  choose selected
    const sql1 = `SELECT COUNT(*) from ${req.body.question}`
    connection.query(sql1, (err, result1) => {
        if (err) {
            throw err
        }
        // console.log(result1)

        const sql = `SELECT correct_result from ${req.body.question} where id=${req.params.id1}`
        connection.query(sql, (err, result) => {
            if (err) {
                throw err
            }
            if (req.params.id1 > result1[0]['COUNT(*)']) {
                res.send('summary')
                return
            } else if (result[0]['correct_result'] === req.params.id2) {
                res.send('correct')
            } else {
                res.send('incorrect')
            }
        })
    })
})

route.get('/getavatar', (req, res) => {
    const sql = `SELECT avatar from student`
    connection.query(sql, (err, result) => {
        if (err) {
            throw err
        }
        res.send(result)
    })
})

route.get('/result_answer', (req, res) => {
    const sql = `UPDATE list_result_answer SET question${req.query.nth_question}='${req.query.result}' where id_user='${req.query.user}' AND id_question='${req.query.id_question}'`
    const sql1 = `UPDATE list_result_answer SET coin='${req.query.coin}' where id_user='${req.query.user}' AND id_question='${req.query.id_question}'`
    const sql2 = `SELECT answer_correct from list_result_answer  where id_user='${req.query.user}' AND id_question='${req.query.id_question}'`
    const sql3 = `SELECT answer_incorrect from list_result_answer  where id_user='${req.query.user}' AND id_question='${req.query.id_question}'`
    const sql4= `SELECT time from list_result_answer where id_user='${req.query.user}' AND id_question='${req.query.id_question}'`
    connection.query(sql, (err, result) => {
        if (err) {
            throw err
        }

    })
    connection.query(sql1, (err, result) => {
        if (err) {
            throw err
        }

    })
    connection.query(sql4, (err,result)=> {
        if(err) {
            throw err
        }
        // console.log(req.query.time)
        const sql= `UPDATE list_result_answer set time= ${(parseInt(result[0]['time']) || 0 ) + parseInt(req.query.time)} where id_user='${req.query.user}' AND id_question='${req.query.id_question}'`
        connection.query(sql, (err,result)=> {
            if(err) {
                throw err
            }
        })
    })
    if (req.query.text==='true') {

        connection.query(sql2, (err, result) => {
            if (err) {
                throw err
            }

            const sql = `UPDATE list_result_answer set answer_correct=${parseInt(result[0]['answer_correct'])+1}  where id_user='${req.query.user}' AND id_question='${req.query.id_question}'`
            connection.query(sql, (err, result) => {
                if (err) {
                    throw err
                }
            })

        })
    }
    else if(req.query.text=== 'false') {
        connection.query(sql3, (err, result) => {
            if (err) {
                throw err
            }

            const sql = `UPDATE list_result_answer set answer_incorrect=${parseInt(result[0]['answer_incorrect'])+1}  where id_user='${req.query.user}' AND id_question='${req.query.id_question}'`
            connection.query(sql, (err, result) => {
                if (err) {
                    throw err
                }
            })

        })
    }
})

route.get('/setquestion', (req, res) => {
    const sql = `SELECT id_user,id_question from list_result_answer where id_user='${req.query.id_user}' and id_question='${req.query.id_question}'`
    connection.query(sql, (err, result) => {
        if (err) {
            throw err
        }
        if (result[0] === undefined) {
            const sql1 = `INSERT INTO list_result_answer(id_user,id_question) values('${req.query.id_user}', '${req.query.id_question}')`
            connection.query(sql1, (err1, result1) => {
                if (err1) {
                    throw err1
                }
            })
        } else {
            return
        }
    })
})

route.get('/statics/bar/:user/:question', (req,res)=> {
    const sql= `SELECT answer_correct , answer_incorrect, coin, time ,trace from list_result_answer  where id_user='${req.params.user}' and id_question='${req.params.question}'`

    connection.query(sql, (err,result)=> {
        if(err) {
            throw err
        }
        res.send(result[0])
    })
})

route.get('/playagain', (req,res)=> {
    const sql= `UPDATE list_result_answer set answer_correct=0 where id_user='${req.query.user}' and id_question='${req.query.question}' `
    const sql2= `UPDATE list_result_answer set answer_incorrect=0 where id_user='${req.query.user}' and id_question='${req.query.question}' `
    const sql3= `UPDATE list_result_answer set time=0 where id_user='${req.query.user}' and id_question='${req.query.question}' `
    connection.query(sql, (err, result)=> {
        if(err) {
            throw err
        }
    })
    connection.query(sql2, (err, result)=> {
        if(err) {
            throw err
        }
    })
    connection.query(sql3, (err, result)=> {
        if(err) {
            throw err
        }
    })
})

server.listen(4000, () => console.log('server run on port 4000'))