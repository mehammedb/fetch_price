const dev = {
    host: 'localhost',
    db: 'dbpythn',
    user: 'mam',
    pass: process.env.PASS
}
const prod = {
    host: 'localhost',
    db: process.env.DB,
    user:process.env.USER,
    pass: process.env.PASS
}

module.exports={dev,prod}