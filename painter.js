// Returns <filter/filter-active HTML>
function template_filter(filter_name, is_active){
    const fragment = new DocumentFragment();
    const template = document.getElementById(is_active ? 'filter-active' : 'filter');
    const instance = document.importNode(template.content, true);

    if (Catalogue.terms.includes(filter_name)) {
        instance.querySelector('slot[name=filter-text]').innerText = prettify_term(filter_name);
    } else {
        instance.querySelector('slot[name=filter-text]').innerText = filter_name.replace('_', ' ');
    }

    fragment.appendChild(instance);
    fragment.querySelector('button[name=filter-container]').onclick = function () { State.toggle_filter(filter_name); };
    return fragment;
}

// returns <course-card/course-card-favorite HTML>
function template_course_card(course_obj, is_favorite){
    const fragment = new DocumentFragment();
    const template = document.getElementById(
        is_favorite ? 'course-card-favorite' : 'course-card');
    const instance = document.importNode(template.content, true);

    instance.querySelector('slot[name=course-number]').innerText = course_obj.number.replace('NaN', '');
    instance.querySelector('slot[name=course-title]').innerText = course_obj.title;
    instance.querySelector('slot[name=course-section-count]').innerText = course_obj.sections.length > 1 ? `${course_obj.sections.length} sections` : '';
    instance.querySelector('#course-icon').onclick = function () { State.toggle_favorite(course_obj.course_id) };
    instance.querySelector('#course-text').onclick = function () { State.draw_section_summary(course_obj.sections[0].crn) };

    if (course_obj.sections.length == 1) {
        instance.querySelector('#course-text').ondblclick = function () { State.toggle_added(course_obj.sections[0].crn) };
    }

    fragment.appendChild(instance);
    return fragment;
}

// Returns <section-summary HTML>
function template_section_summary(crn, is_added, term){
    const fragment = new DocumentFragment();
        const template = document.getElementById('section-summary');
        const instance = document.importNode(template.content, true);

        const section = Catalogue.get_section_by_crn(crn);
        const course = Catalogue.get_course(section.course_id);

        instance.querySelector('slot[name=section-toggle-text]').innerText = is_added ? 'Remove' : 'Add';
        instance.querySelector('#section-toggle').onclick = function () { State.toggle_added(crn) };
        const toggle_base = 'px-4 py-3 rounded text-white dark:text-gray-200 duration-300';
        instance.querySelector('#section-toggle').className = is_added ? `${toggle_base} bg-red-600 hover:bg-red-700` : `${toggle_base} bg-blue-600 hover:bg-blue-700`;

        instance.querySelector('slot[name=section-crn]').innerText = crn;
        instance.querySelector('slot[name=section-title]').innerText = course.title;
        instance.querySelector('slot[name=section-type]').innerText = section.class_type;
        instance.querySelector('slot[name=section-number]').innerText = section.number;
        instance.querySelector('slot[name=section-cultures]').innerHTML = section.culture_options.join(' ') !== '' ? `${section.culture_options.join(' ')} &bullet;` : '';
        instance.querySelector('slot[name=section-distributions]').innerHTML = section.distributions.join(' ') !== '' ? `${section.distributions.join(' ')} &bullet;` : '';
        instance.querySelector('slot[name=section-language]').innerHTML = section.Lang != null ? `${section.Lang} &bullet;` : '';
        instance.querySelector('slot[name=section-enrolled]').innerHTML = section.enrolled === 0 ? '': section.enrolled ?? '';
        instance.querySelector('slot[name=section-enroll-limit]').innerHTML = section.enroll_limit > 900 ? '&infin;' : section.enroll_limit ?? '';
        const instructors = section.instructors.map(entry => `<a class='underline' href='mailto:${entry.email}'>${entry.name}</a>`).join(', ')
        instance.querySelector('slot[name=section-instructors]').innerHTML = instructors !== '' ? `Prof. ${instructors} &bullet;` : '';
        instance.querySelector('slot[name=section-summary]').innerHTML = (course.summary).replaceAll('&nbsp;', ' ').trim();
        instance.querySelector('slot[name=section-prerequisites]').innerText = course.prerequisites != null ? `Requires: ${course.prerequisites}` : '';
        instance.querySelector('slot[name=section-course-number]').innerText = course.number;
        instance.querySelector('slot[name=section-raw-textbooks]').innerText = section.textbooks;
        instance.querySelector('slot[name=section-schedule-block]').innerText = section.schedule_block ?? 'AR';
        instance.querySelector('slot[name=section-priorities]').innerText = `${section.priorities.length > 0 ? 'Priorities: ' : ''}${section.priorities.join(' > ')}`;
        instance.querySelector('slot[name=section-schedule-times').innerHTML = Object.keys(section.schedule)
            .map(day => section.schedule[day]
                .map(session =>
                    `${session.room ?? 'TBD'} ${session.building ?? 'TBD'} - ${day} ${session.start_time.toTimeString().substr(0, 5)} - ${session.end_time.toTimeString().substr(0, 5)} ${session.x_hour ? '(X)' : ''}`
                )
            ).flat()
            .filter(entry => entry !== '')
            .join('<br>');


        const crosslist_template = document.getElementById('crosslist');
        const crosslist_fragment = new DocumentFragment();
        [...course.sections.filter(s => s.term === term).map(s => s.crn), ...course.sections.map(s => s.crosslist_crns).flat()]
            .filter(s => s !== crn)
            .forEach(s => {
                const crosslist_instance = document.importNode(crosslist_template.content, true);
                crosslist_instance.querySelector('slot[name=crosslist-course]').innerText = Catalogue.get_course(Catalogue.get_section_by_crn(s).course_id).number;
                crosslist_instance.querySelector('slot[name=crosslist-section-number]').innerText = Catalogue.get_section_by_crn(s).number;
                crosslist_instance.querySelector('slot[name=crosslist-class-type]').innerText = Catalogue.get_section_by_crn(s).class_type;
                crosslist_instance.querySelector('button[name=crosslist-container]').onclick = function () { State.draw_section_summary(s) };
                crosslist_fragment.appendChild(crosslist_instance);
            }
            );
        instance.querySelector('div[name=section-other-sections]').append(crosslist_fragment);


        const thumbnail_template = document.getElementById('thumbnail');
        const thumbnails_fragment = new DocumentFragment();
        const ISBNS = ((section.textbooks ?? '').match(/[\d-X]{10,}/g) ?? [])
            .map(isbn => isbn.replaceAll('-', ''))
            .filter((isbn, ind, arr) => !arr.some(i => i !== isbn && i.substr(0, i.length - 1).includes(isbn.substr(0, isbn.length - 1))));
        ISBNS.forEach(isbn => {
            const thumbnails_micro_fragment = new DocumentFragment();
            const thumbnail_instance = document.importNode(thumbnail_template.content, true);
            thumbnail_instance.querySelector('#thumbnail-image').src = `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`;
            thumbnails_micro_fragment.appendChild(thumbnail_instance);
            thumbnails_micro_fragment.querySelector('a[name=thumbnail-container]').id = `i${isbn}`;
            thumbnails_fragment.appendChild(thumbnails_micro_fragment);
            fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`)
                .then(response => { return response.json(); })
                .then(data => {
                    if (data.items !== undefined) {
                        document.querySelector(`#i${isbn}`).href = data.items[0].volumeInfo.canonicalVolumeLink;
                    }
                });
        });
        instance.querySelector('div[name=section-textbook-thumbnails]').appendChild(thumbnails_fragment);

        fragment.appendChild(instance);
        return fragment;
}

// Refreshes calendar
function draw_calendar(added_crns, term) {
    var events = [];
    const colors = ['red-600', 'yellow-600', 'blue-600', 'orange-600', 'green-600'];
    let color_index = 0;
    let number2color = {};

    added_crns
        .filter(crn => Catalogue.get_section_by_crn(crn).term === term)
        .forEach(crn => {
            const section = Catalogue.get_section_by_crn(crn);
            const course = Catalogue.get_course(section.course_id);
            if (!(course.number in number2color)) {
                number2color[course.number] = colors[color_index];
                color_index = (color_index + 1) % colors.length;
            }
            if (Math.max(...Object.values(section.schedule).map(events => events.length)) == 0) {
                events.push(
                    {
                        daysOfWeek: [1, 2, 3, 4, 5],
                        title: `${course.number}\n${course.title}`,
                        classNames: `cursor-pointer truncate text-xs border-0 font-medium bg-${number2color[course.number]}/90 hover:bg-${number2color[course.number]} duration-300`,
                        ID: crn
                    }
                );
            } else {
                Object.entries(section.schedule).forEach(([day, value]) => {
                    value.forEach(entry => {
                        events.push({
                            daysOfWeek: [{ Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 0 }[day]],
                            title: `${course.number} ${entry.x_hour ? 'X' : ''}\n${course.title}\n${entry.room ?? ''} ${entry.building ?? ''}`,
                            classNames: `p-1 cursor-pointer truncate text-xs border-0 font-medium bg-${number2color[course.number]}/90 hover:bg-${number2color[course.number]} duration-300`,
                            ID: crn,
                            startTime: `${entry.start_time.getHours()}:${String(entry.start_time.getMinutes()).padStart(2, "0")}`,
                            endTime: `${entry.end_time.getHours()}:${String(entry.end_time.getMinutes()).padStart(2, "0")}`,
                        })
                    });
                });
            }
        });

    const calendarEl = document.querySelector('#calendar');
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'timeGridWeek',
        dayHeaderFormat: { weekday: 'short' },
        initialDate: `2022-08-01`,
        slotMinTime: '07:00',
        slotMaxTime: '21:30',
        headerToolbar: { left: '', center: '', right: '' },
        weekends: false,
        nowIndicator: true,
        expandRows: true,
        slotEventOverlap: false,
        events: events,
        eventContent: function (arg) {
            return {
                html: arg.event.title.replace(/\n/g, '<br>')
            }
        },
        eventClick: function (info) {
            State.draw_section_summary(info.event.extendedProps.ID);
        }
    });

    calendar.render();
}