// Copyright (C) 2024 Daniel Ellison Th '24. All rights reserved.

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

class Section {
    constructor(section_id, course_id) {
        this.section_id = section_id;
        this.course_id = course_id;

        this.term = API.academic.sections[this.section_id].term.sis_term_code;
        this.crn = API.academic.sections[this.section_id].crn;
        this.class_type = API.academic.section_types[API.academic.sections[this.section_id].type_id];
        this.number = Number(API.academic.sections[this.section_id].section_number).toString();

        this.textbooks = API.academic.sections[this.section_id].required_materials;
        this.instructors = API.academic.sections[this.section_id].instructors
            .map(instructor => API.people[instructor.netid]);
        this.priorities = API.academic.sections[this.section_id].priorities
            .sort((a, b) => a.item_number - b.item_number)
            .map(entry => `${entry.school_year} ${entry.major_id ?? ''} ${entry.type ?? ''}`.trim());
        this.crosslist_crns = API.academic.sections[this.section_id].crosslist?.sections
            .filter(entry => entry.id.split('-')[1] === this.term)
            .map(entry => entry.id.split('-')[3]) ?? [];

        this.culture_options = Timetable[this.crn]?.wc ?? [];
        this.distributions = Timetable[this.crn]?.dist ?? [];
        this.FYS = Timetable[this.crn]?.fys ?? false;
        this.enroll_limit = Timetable[this.crn]?.lim ?? API.academic.sections[this.section_id].enroll_limit;
        this.enrolled = Timetable[this.crn]?.enrl;
        this.Lang = Timetable[this.crn]?.lang;

        this.schedule = { Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [], Sun: [] }
        const api_schedule = API.academic.sections[this.section_id].schedule;
        const api_schedule_day_converter = { 'M': 'Mon', 'T': 'Tue', 'W': 'Wed', 'R': 'Thu', 'F': 'Fri', 'S': 'Sat', 'U': 'Sun' };
        if (api_schedule !== null) {
            for (const session of api_schedule.sessions) {
                for (const day of session.class_days) {
                    this.schedule[api_schedule_day_converter[day.id]].push(
                        {
                            start_date: new Date(session.start_date),
                            end_date: new Date(session.end_date),
                            start_time: new Date(`January 1, 2020 ${session.local_begin_time}`),
                            end_time: new Date(`January 1, 2020 ${session.local_end_time}`),
                            x_hour: session.is_x_session,
                            building: session.location?.building.name.replace('*', ''),
                            room: session.location?.room
                        }
                    )
                }
            }
        }

        this.open_seats = this.enroll_limit - this.enrolled > 0 ?? true;
        this.schedule_block = Timetable[this.crn]?.pd ?? api_schedule?.type_id;
    }

    is_matching(active_filters, added) {
        if (active_filters.term != this.term) {
            return false;
        } else if (active_filters.culture_options.length > 0 && this.culture_options.every(culture => !active_filters.culture_options.includes(culture))) {
            return false;
        } else if (active_filters.distributions.length > 0 && this.distributions.every(dist => !active_filters.distributions.includes(dist))) {
            return false;
        } else if (active_filters.FYS && !this.FYS) {
            return false;
        } else if (active_filters.Lang && this.Lang == null) {
            return false;
        } else if (active_filters.Open_Seats && this.open_seats !== null & this.open_seats <= 0) {
            return false;
        } else if (active_filters.Fits_Schedule) {
            for (const other_section of added) {
                for (const day of Object.keys(this.schedule)) {
                    for (const session of this.schedule[day]) {
                        for (const other_session of other_section.schedule[day]) {
                            if (
                                (
                                    (session.start_date <= other_session.start_date && other_session.start_date <= session.end_date) ||
                                    (session.start_date <= other_session.end_date && other_session.end_date <= session.end_date)
                                ) && (
                                    (session.start_time <= other_session.start_time && other_session.start_time <= session.end_time) ||
                                    (session.start_time <= other_session.end_time && other_session.end_time <= session.end_time)
                                )
                            ) {
                                return false;
                            }
                        }
                    }
                }
            }
        }

        return true;
    }
}

class Course {
    constructor(course_id, sections) {
        this.course_id = course_id;
        this.sections = sections;

        this.number = `${API.academic.courses[this.course_id].subject_id} ${API.academic.courses[this.course_id].course_number.replace(/^0+/, '')}`;
        this.title =  API.academic.courses[this.course_id].orc_title ?? API.academic.courses[this.course_id].name;
        this.schools = API.academic.courses[this.course_id].schools.map(entry => entry.id);
        this.prerequisites = API.academic.courses[this.course_id].prerequisites;
        this.summary = API.academic.courses[this.course_id].orc_description ?? 'No description available';
    }
    
    matching_sections(active_filters, added) {
        let clone = structuredClone(this);
        clone.sections = this.sections.filter(section => section.is_matching(active_filters, added));
        return clone;
    }
}

class Catalogue {
    static {
        this.canonical = Object.fromEntries(Object.keys(API.academic.courses).sort(collator.compare).map(id => [id, new Course(id, this.#getMatchingSections(id))]));
        this.terms = [...new Set(Object.values(this.canonical).map(v => v.sections.map(s => s.term)).flat())].sort();
        this.schools = [...new Set(Object.values(this.canonical).map(v => v.schools).flat())].sort();
        this.cultures = [...new Set(Object.values(Timetable).map(v => v.wc).flat())].sort();
        this.dists = [...new Set(Object.values(Timetable).map(v => v.dist).flat())].sort();

        // free data.js from memory
        delete API.academic;
        delete API.people;
        Object.keys(Timetable).map(k => delete Timetable[k]);
    }

    static #getMatchingSections(course_id) {
        return Object.entries(API.academic.sections)
            .filter(([_, val]) => val.course_id === course_id)
            .map(([id, _]) => new Section(id, course_id))
            .sort(collator.compare);
    }

    static get_section_by_crn(crn){
        return Object.values(this.canonical)
                     .map(course => course.sections)
                     .flat()
                     .filter(section => section.crn == crn)[0]
    }

    static get_course(course) {
        return this.canonical[course];
    }
    
    static query(active_filters, favorites, added, text_query) {
        return Object.values(this.canonical)
            .filter(course => course.schools.some(school => active_filters.schools.includes(school)))
            .filter(course => !active_filters.Favorites || favorites.includes(course.course_id))
            .filter(course => !active_filters.No_Prereqs || course.prerequisites === null)
            .filter(course => text_query.toLowerCase().split(' ').every(token => course.number.toLowerCase().includes(token) || course.title.toLowerCase().includes(token)))
            .map(course => course.matching_sections(active_filters, added.map(crn => this.get_section_by_crn(crn))))
            .filter(course => course.sections.length > 0);
    }

}
