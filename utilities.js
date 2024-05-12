// Adjust calendar to window resizing
window.onresize = function () {
    State.draw_calendar();
}

// 202301 -> 23W
function prettify_term(term) {
    const year = term.substr(2, 2);
    const season = { '01': 'W', '03': 'S', '06': 'X', '09': 'F' }[term.substr(4, 2)];
    return `${year}${season}`;
}

// Returns the date of the first Mon/Tue/Wed/Thu/Fri/Sat/Sun after given datestamp.
function get_first_date_after(date, day_of_week) {
    const goal = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 }[day_of_week]
    let day = date.getDay();
    const shift = goal >= day ? goal - day : 6 - day + 1 + goal;
    date.setTime(date.getTime() + (shift * 24 * 60 * 60 * 1000));
    return date
}

// Download ical file with given CRNs
function export_calendar(added_crns) {
    let cal = ics();
    added_crns.forEach(crn => {
        const section = Catalogue.get_section_by_crn(crn);
        const course = Catalogue.get_course(section.course_id);
        Object.entries(section.schedule).forEach(([day, value]) => {
            value.forEach(entry => {
                cal.addEvent(
                    course.number,
                    course.title,
                    `${entry.room ?? ''} ${entry.building ?? ''}`,
                    `${get_first_date_after(entry.start_date, day).toLocaleDateString("en-US")} ${entry.start_time.getHours()}:${String(entry.start_time.getMinutes()).padStart(2, "0")}`,
                    `${get_first_date_after(entry.start_date, day).toLocaleDateString("en-US")} ${entry.end_time.getHours()}:${String(entry.end_time.getMinutes()).padStart(2, "0")}`,
                    {
                        freq: 'WEEKLY',
                        until: entry.end_date.toLocaleDateString("en-US")
                    }
                );
            });
        });
    });

    cal.download(`Dartmouth Calendar`);
}

// Set cookie with expiration
function setCookie(cname, cvalue, exdays) {
    const d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    let expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/; SameSite=Lax;";
}

// Read cookie
function getCookie(cname) {
    let name = cname + "=";
    let ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) === 0) {
            return c.substring(name.length, c.length);
        }
    }
    return undefined;
}