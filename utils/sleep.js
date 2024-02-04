const sleep = (ms) => new Promise((resolve, reject) => { setTimeout(() => resolve(true), ms) })

module.exports = sleep;