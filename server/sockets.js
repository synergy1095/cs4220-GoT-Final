module.exports = (server) => {
    const
        io = require('socket.io')(server),
        moment = require('moment'),
        gotApi = require('./index.js')

    const searched = []

    // When page is loaded, event is fired
    io.on('connection', socket => {

        // load search history
        socket.emit('refresh-history', searched)

        socket.on('clicked-history', input => {
            const prevSearched = searched.filter(searchedItem => searchedItem.search.query.toUpperCase() === input.query.toUpperCase())

            io.emit('retrieved-prev-result', prevSearched)
        })

        socket.on('entered-search', input => {
            // Filter thorugh our searched history return any object that matches
            const prevSearched = searched.find(searchedItem => searchedItem.search.query.toUpperCase() === input.query.toUpperCase())

            // If none, then create new and emit success, else emit previously searched
            if (!prevSearched) {
                gotApi.search(input.searchType, input.page, input.pageSize, input.queryType, input.query)
                    .then(res => {
                        const search = {
                            id: socket.id,
                            search: input,
                            results: res.length > 0 ? res : null
                        }

                        searched.push(search)
                        io.emit('successful-search', search)
                    })
                    .catch(err => io.emit('error-api', err))
            } else if (prevSearched.search.page != input.page){
            // same search but changing page
                gotApi.search(input.searchType, input.page, input.pageSize, input.queryType, input.query)
                    .then(res => {
                        io.emit('successful-search', search)
                    })
                    .catch(err => io.emit('error-api', err))
            } else {
                io.emit('retrieved-prev-result', prevSearched)
            }
        })
    })
}