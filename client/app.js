//app.js----------------------------------------------------------------------------------------------------------------------------------------

// App components
Vue.component('input-search', {
    props: ['value'],
    template: `
    <input @keyup.enter="updateSelf($event.target.value)" :value="value" placeholder="ENTER YOUR QUERY" type="text">`,
    methods: {
        updateSelf(value) {
            this.$emit('input', value)
        }
    }
})

const searchComponent = {
    template: ` <div id="searchAndNotifications" class="text-center">
                    <h3 class="text-left">Search</h3>
                    <select @change="updateSelect($event.currentTarget.value)">
                        <option v-for="category in categories" v-bind:value="category">
                            {{category}}
                        </option>
                    </select>
                    <input-search @input="updateSearch" ></input-search>

                    <div v-show="message">
                        <h5>{{message}}</h5>
                    </div>
                </div>`,

    props: ['categories', 'message'],
    methods: {
        updateSearch(val) {
            this.$emit('input', val)
        },
        updateSelect(val) {
            this.$emit('update', val)
        }
    }
}

const resultsComponent = {
    template: `<div>
                <h3>Results</h3>
                <ol>
                    <li v-for="result in results">
                        <span @click="$root.getDetailedResultClickHandler(result)">{{result.name}}</span>
                    </li>
                </ol>
            </div>`,
    props: ['results']
}

const moreDetailsComponent = {
    template: `<div>
                <span id="breadcrumb" @click="$root.listResults">Results </span>\> <span id="currentBreadCrumb">{{result.name}}</span>
                <br/>
                <img src="https://pbs.twimg.com/profile_images/3458870084/01be7a6f27e243f7a205698006d115b1_400x400.png" width="200" height="200"/>
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
                        <span @click="$root.searchHistoryClickHandler(s.id)">{{s.search.query}}</span>
                    </li> 
                </ul>
            </div>`,
    props: ['searched']
}



const socket = io()
const app = new Vue({
    el: '#got-app',
    data: {
        selected: 'characters name',
        categories: ['characters name', 'houses name', 'houses region', 'books name'],
        search: {
            searchType: null,
            pageSize: 10,
            page: 1,
            queryType: null,
            query: null,
        },
        searched: [],
        message: '',
        results: [],
        result: [],
        detailedResult: false
    },
    methods: {
        searchHistoryClickHandler: function (prevSearchID) {
            socket.emit('clicked-history', prevSearchID)
        },
        getDetailedResultClickHandler: function (ob) {
            this.detailedResult = true
            this.result = ob
            this.message = ''
        },
        listResults: function () {
            this.detailedResult = false
        },
        searchUpdate: function (val) {
            this.search.query = val

            const selectedArray = this.selected.split(" ")
            this.search.searchType = selectedArray[0]
            this.search.queryType = selectedArray[1]
            socket.emit('entered-search', this.search)
        },
        selectUpdate: function (val) {
            this.selected = val
        }
    },
    components: {
        'search-component': searchComponent,
        'results-component': resultsComponent,
        'history-component': historyComponent,
        'moredetails-component': moreDetailsComponent
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

    if (search.results) {
        app.message = `${search.results.length} results found for "${search.search.query}".`
        app.results = search.results
    }

    app.searched.push(search)
})

socket.on('retrieved-prev-result', retrievedResult => {
    app.results = []
    app.detailedResult = false
    const keyword = retrievedResult.search.query

    app.results = retrievedResult.results

    app.results !== null ? app.message = `Found ${app.results.length} cached results for "${keyword}".` : app.message = `No results found from cached history for "${keyword}".`
})

socket.on('err-api', err => {
    app.message = `[Api] ${err}`
})