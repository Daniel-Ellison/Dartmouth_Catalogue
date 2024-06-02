class State {
    static favorites = [];
    static added = [];

    static active_filters;

    static {
        this.loadCookies()
        this.reset_filters();
    }

    // set all filter values to defaults
    static reset_filters() {
        this.active_filters = {
            term: Catalogue.terms[0],
            schools: ['UG'],
            culture_options: [],
            distributions: [],
            FYS: false,
            Lang: false,
            Favorites: false,
            No_Prereqs: false,
            Open_Seats: false,
            Fits_Schedule: false
        }

        this.draw_filters();
        this.draw_course_list();
        let temp_query = Catalogue.query(this.active_filters, this.favorites, this.added, '');
        if (temp_query.length > 0){
            this.draw_section_summary(temp_query[0].sections[0].crn)
        }
        draw_calendar(this.added, this.active_filters.term);
    }

    // return true/false if filter is active
    static is_filter_active(filter) {
        if (Catalogue.terms.includes(filter)) {
            return this.active_filters.term === filter;
        } else if (Catalogue.schools.includes(filter)) {
            return this.active_filters.schools.includes(filter);
        } else if (Catalogue.cultures.includes(filter)) {
            return this.active_filters.culture_options.includes(filter);
        } else if (Catalogue.dists.includes(filter)) {
            return this.active_filters.distributions.includes(filter);
        } else if (['FYS', 'Lang', 'Favorites', 'No_Prereqs', 'Open_Seats', 'Fits_Schedule'].includes(filter)) {
            return this.active_filters[filter];
        }
    }

    // Activate/Deactivate filter (Note: requires a term & school filter always be active)
    static toggle_filter(filter) {
        if (Catalogue.terms.includes(filter)) {
            this.active_filters.term = filter;
            draw_calendar(this.added, this.active_filters.term);
        } else if (Catalogue.schools.includes(filter)) {
            if (this.active_filters.schools.includes(filter)) {
                if (this.active_filters.schools.length > 1) {
                    this.active_filters.schools = this.active_filters.schools.filter(school => school !== filter);
                }
            } else {
                this.active_filters.schools.push(filter);
            }
        } else if (Catalogue.cultures.includes(filter)) {
            if (this.active_filters.culture_options.includes(filter)) {
                this.active_filters.culture_options = this.active_filters.culture_options.filter(culture => culture !== filter);
            } else {
                this.active_filters.culture_options.push(filter);
            }
        } else if (Catalogue.dists.includes(filter)) {
            if (this.active_filters.distributions.includes(filter)) {
                this.active_filters.distributions = this.active_filters.distributions.filter(dist => dist !== filter);
            } else {
                this.active_filters.distributions.push(filter);
            }
        } else if (['FYS', 'Lang', 'Favorites', 'No_Prereqs', 'Open_Seats', 'Fits_Schedule'].includes(filter)) {
            this.active_filters[filter] = !this.active_filters[filter];
        }

        this.draw_filters();
        this.draw_course_list();
    }

    // Draw section summary
    static draw_section_summary(crn) {
        document.querySelector('#section-summary-container').innerHTML = '';
        document.querySelector('#section-summary-container').append(template_section_summary(crn, this.added.includes(crn), this.active_filters.term));
    }

    // Add/Remove course to favorites
    static toggle_favorite(course_id) {
        if (this.favorites.includes(course_id)) {
            this.favorites = this.favorites.filter(course => course !== course_id);
        } else {
            this.favorites.push(course_id);
        }
        this.draw_course_list();
        this.updateCookies();
    }

    // Remove all added courses
    static clear_added() {
        this.crn = this.added.filter(crn => Catalogue.get_section_by_crn(crn).term == this.active_filters.term)[0]
        this.added = this.added.filter(crn => Catalogue.get_section_by_crn(crn).term !== this.active_filters.term)
        draw_calendar(this.added, this.active_filters.term);
        this.draw_section_summary(this.crn);
        this.updateCookies();
    }

    // Add/Remove course
    static toggle_added(crn) {
        if (this.added.includes(crn)) {
            this.added = this.added.filter(section => section !== crn);
        } else {
            this.added.push(crn);
        }
        draw_calendar(this.added, this.active_filters.term);
        this.draw_section_summary(crn);
        this.updateCookies();
    }

    // Populate course table
    static draw_course_list() {
        const text_query = document.querySelector('#search').value;
        document.querySelector('#course-list').innerHTML = '';
        const query = Catalogue.query(this.active_filters, this.favorites, this.added, text_query)
        if (query.length > 0) {
            document.querySelector('#course-list').append(...query
                .map(course => template_course_card(course, this.favorites.includes(course.course_id))));
        } else {
            document.querySelector('#course-list').innerHTML = '<p class="py-2 text-center italic">No matching courses found. Try relaxing your filters / changing terms.</p>';
        }
    }

    // Draw the filter ribbon
    static draw_filters() {
        document.title = `${prettify_term(this.active_filters.term)} | Dartmouth`;
        document.querySelector('#search').placeholder = `Search Dartmouth ${prettify_term(this.active_filters.term)}`;

        document.querySelector('#terms').innerHTML = '';
        document.querySelector('#terms').append(...Catalogue.terms.map(term => template_filter(term, this.is_filter_active(term))));

        document.querySelector('#schools').innerHTML = '';
        document.querySelector('#schools').append(...Catalogue.schools.map(term => template_filter(term, this.is_filter_active(term))));

        document.querySelector('#culture-options').innerHTML = '';
        document.querySelector('#culture-options').append(...Catalogue.cultures.map(term => template_filter(term, this.is_filter_active(term))));

        document.querySelector('#distributions').innerHTML = '';
        document.querySelector('#distributions').append(...Catalogue.dists.map(term => template_filter(term, this.is_filter_active(term))));

        const other_timetable_filters = ['FYS', 'Lang']
        document.querySelector('#other-timetable-filters').innerHTML = '';
        document.querySelector('#other-timetable-filters').append(...other_timetable_filters.map(term => template_filter(term, this.is_filter_active(term))));

        const general_filters = ['Favorites', 'No_Prereqs', 'Open_Seats', 'Fits_Schedule'];
        document.querySelector('#general').innerHTML = '';
        document.querySelector('#general').append(...general_filters.map(term => template_filter(term, this.is_filter_active(term))));
    }

    // Store current state in cookies
    static updateCookies() {
        setCookie('added', JSON.stringify(this.added), 100);
        setCookie('favorites', JSON.stringify(this.favorites), 100);
    }

    // Load state from cookies
    static loadCookies() {
        const added = getCookie('added');
        if (added != undefined) {
            this.added = JSON.parse(added).filter(crn => Catalogue.get_section_by_crn(crn) !== undefined);
        }

        const favorites = getCookie('favorites');
        if (favorites !== undefined) {
            this.favorites = JSON.parse(favorites);
        }
    }

}
