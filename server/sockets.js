//socket.js --------------------------------------------------------------------------------------------------------------------------------------------
module.exports = (server) => {
    const
        io = require('socket.io')(server),
        moment = require('moment'),
        gotApi = require('./index.js')

    const searched = []
    let id_ = 0

    // When page is loaded, event is fired
    io.on('connection', socket => {

        // load search history
        socket.emit('refresh-history', searched)

        socket.on('clicked-history', searchID => {
            const prevSearched = searched.find(searchedItem => searchedItem.id === searchID)

            io.emit('retrieved-prev-result', prevSearched)
        })

        socket.on('entered-search', input => {
            // Filter thorugh our searched history return any object that matches
            let prevSearched = null
            if (searched.length)
                prevSearched = searched.find(searchedItem => 
                    searchedItem.search.query.toUpperCase() === input.query.toUpperCase() 
                    && searchedItem.search.searchType === input.searchType
                    && searchedItem.search.queryType === input.queryType)

            // If none, then create new and emit success, else emit previously searched
            if (!prevSearched) {
                gotApi.search(input.searchType, input.page, input.pageSize, input.queryType, input.query)
                    .then(res => {
                        const search = {
                            id: id_,
                            search: input,
                            results: res.length > 0 ? res : null
                        }
                        id_++
                        searched.push(search)
                        io.emit('successful-search', search)
                    })
                    .catch(err => io.emit('error-api', err))
            } else if (prevSearched.search.page != input.page) {
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