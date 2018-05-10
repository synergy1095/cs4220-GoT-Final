import { character } from "../server";

// App components
const resultsComponent = {
    template: `<div>
                <h3>Results</h3>
                <ol v-for="result in results">
                    <li v-for="r in result">
                        <span @click="$root.getDetailedResultClickHandler(r)">{{r.name}}</span>
                    </li>
                </ol>
            </div>`,
    props: ['results']
}

const moreDetailsComponent = {
    template: `<div>
                <span id="breadcrumb" @click="$root.listResults">Results </span>\> <span id="currentBreadCrumb">{{result.name}}</span>
                <div id="details-ul">
                    <ul v-for="(value, key) in result">
                        <span id="label" class="badge badge-secondary">{{key}}</span> <br>
                        {{value}}
                    </ul>
                </div>
            </div>`,
    props: ['result']
}

const historyComponent = {
    template: `<div>
                <h3>Previous Search History</h3>
                <ul v-for="s in searched">
                    <li>
                        <span @click="$root.searchHistoryClickHandler(s.keyword)">{{s.keyword}}</span>
                    </li> 
                </ul>
            </div>`,
    props: ['searched']
}

const socket = io()
const app = new Vue({
    el: '#got-app',
    data: {
        //(searchType, page = 1, pageSize = 10, queryType = null, query = null, answers = null)
        search: {
            searchType: character,
            pageSize: 10,
            page: 1,
            queryType: null,
            query: null,
        },
        searched: [],
        message: '',
        results: [],
        result: [],
        detailedResult: false,
    },
    methods: {
        searchHandler: function () {
            if (!this.search) return
            
            socket.emit('entered-search', this.search)
        },
        searchHistoryClickHandler: function (prevSearchedKeyword) {
            socket.emit('clicked-history', prevSearchedKeyword)
        },
        getDetailedResultClickHandler: function (ob) {
            this.detailedResult = true
            this.result = ob
            this.message = ''
        },
        listResults: function () {
            this.detailedResult = false
        }
    },
    components: {
        'results-component': resultsComponent,
        'history-component': historyComponent,
        'moredetails-component': moreDetailsComponent,
    }
})

// Client Side Socket Event
socket.on('refresh-history', searched => {
    app.searched = searched
})

socket.on('successful-search', search => {
    app.detailedResult = false
    app.message = 'No results found.'
    app.results = []

    if(search.results) {
        app.message = `${search.results.length} results found for "${search.keyword}".`
        app.results.push(search.results)
    }    

    app.searched.push(search)
})

socket.on('retrieved-prev-result', retrievedResult => {
    app.results = []
    app.search = ''
    app.detailedResult = false
    let keywords = []

    retrievedResult.forEach(res => {
        app.results.push(res.results)

        if (!keywords.includes(res.keyword))
            keywords.push(res.keyword)
    })

    keywords = keywords.join(',')

    // Since we get an array of dictonary back, we know that at most array.len = 1 & array[0] is the cached result 
    app.results[0] !== null ? app.message = `Found ${app.results[0].length} cached results for "${keywords}".`: app.message = `No results found from cached history for "${keywords}".`
})

socket.on('err-api', err => {
    app.message = `[Api] ${err}`
})