//index.js----------------------------------------------------------------------------------------------------------------------------------------
const
    config = require('./config'),
    superagent = require('superagent')
queryTypes = {
    'books': ['show all', 'name'],
    'characters': ['show all', 'name', 'male', 'female', 'culture', 'alive', 'dead'],
    'houses': ['show all', 'name', 'region']
}

const _fetch = (command) => {
    // console.log(`${config.url}/${command}`)
    return superagent.get(`${config.url}/${command}`)
        .then(response => response.body)
        .catch(error => error.response.body)
}

exports.search = (type, page = 1, pageSize = 10, queryType = null, query = null) => {
    return _fetch(query ? `${type}?page=${page}&pageSize=${pageSize}&${queryType}=${query}`
        : `${type}?page=${page}&pageSize=${pageSize}`)
}

exports.getQueryTypes = (type) => {
    return queryTypes[type]
}

exports.getByID = (type, id) => {
    return _fetch(`${type}/${id}`)
}

exports.getTypes = () => {
    foundTypes = []
    for (let key in queryTypes)
        foundTypes.push(key)
    return foundTypes
}