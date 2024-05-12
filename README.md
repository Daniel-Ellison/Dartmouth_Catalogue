# Dartmouth_Catalogue
Course catalogue web app for Dartmouth College.

Consists primarily of static objects `Catalogue` (handling data) and `State` (handling user interaction).

Vendored libraries: FullCalendar (v6.1.11), TailwindCSS (v3.4.3), ICS (2017).

## `Catalogue` (catalogue.js)


```
>>> Catalogue.get_section_by_crn("30733")
<Section object>

>>> Catalogue.get_course("AAAS.010-202309")
<Course object>

>>> Catalogue.query(
    {
        term: '202303',
        schools: ['UG'],
        culture_options: [],
        distributions: [],
        FYS: false,
        Lang: false,
        Favorites: false,
        No_Prereqs: false,
        Open_Seats: false,
        Fits_Schedule: false
    },
    ['favorite crns'], 
    ['added section ids'],
    'text search'
    )
[<Course object>, ...]
```
### Data Format
#### Catalogue Object (sample)
```
{
    "canonical": { course_id : <Course object>},
    "cultures": ["CI", "NW", "W"],
    "dists": ["ART", "INT", ...],
    "schools": ["DM", "GR", "PE", ...],
    "terms": ["202303", "202403", ...]
}
```

#### Section Object (sample)

```
{
  "section_id": "AAAS.010.01-202403-U-30844",
  "course_id": "AAAS.010-202309",
  "term": "202403",
  "crn": "30844",
  "class_type": "Lecture",
  "number": "1",
  "textbooks": null,
  "instructors": [
    {
      "name": "Rich Blint",
      "email": "Rich.Blint@dartmouth.edu"
    }
  ],
  "priorities": [
    "Senior AAAS Majors",
    "Senior AAAS Minors",
    "Senior AAAS Modifieds",
    "Junior AAAS Majors",
    "Junior AAAS Minors",
    "Junior AAAS Modifieds",
    "First-Years  Other",
    "Random"
  ],
  "crosslist_crns": [],
  "culture_options": [
    "CI"
  ],
  "distributions": [
    "SOC"
  ],
  "FYS": false,
  "enroll_limit": 30,
  "enrolled": 29,
  "Lang": null,
  "schedule": {
    "Mon": [],
    "Tue": [
      {
        "start_date": "2024-03-25T04:00:00.000Z",
        "end_date": "2024-06-04T04:00:00.000Z",
        "start_time": "2020-01-01T19:25:00.000Z",
        "end_time": "2020-01-01T21:15:00.000Z",
        "x_hour": false,
        "building": "Carson",
        "room": "L02"
      }
    ],
    "Wed": [
      {
        "start_date": "2024-03-25T04:00:00.000Z",
        "end_date": "2024-06-04T04:00:00.000Z",
        "start_time": "2020-01-01T22:30:00.000Z",
        "end_time": "2020-01-01T23:20:00.000Z",
        "x_hour": true,
        "building": "Carson",
        "room": "L02"
      }
    ],
    "Thu": [
      {
        "start_date": "2024-03-25T04:00:00.000Z",
        "end_date": "2024-06-04T04:00:00.000Z",
        "start_time": "2020-01-01T19:25:00.000Z",
        "end_time": "2020-01-01T21:15:00.000Z",
        "x_hour": false,
        "building": "Carson",
        "room": "L02"
      }
    ],
    "Fri": [],
    "Sat": [],
    "Sun": []
  },
  "open_seats": true,
  "schedule_block": "2A"
}
```

#### Course Object (sample)

```
{
    course_id: "AAAS.010-202309"
    number: "AAAS 10"
​​​    prerequisites: null
​​​    schools: Array [ "UG" ]
​​​    sections: Array [ {…} ]
​    summary: "<p>A multidisciplinary investigation into the lives and cultures of people of African descent in the Americas. Topics may include: the African background, religion and the black church, popular culture, slavery and resistance, morality and literacy, the civil rights movement, black nationalism, theories of race and race relations.</p>"
​​​     title: "Introduction to African-American Studies"
}
```

## `State` (state.js)


| Methods| Returns|Called From|
|------|-------|---|
State.reset_filters() | | Reset Filter Button
State.toggle_filter(filter)| | Filter Buttons
State.draw_section_summary(crn)| | Rows of Course Table (Button)
State.toggle_favorite(course_id)||Star Buttons in Course Table
State.clear_added()| | Clear Catalogue Button
State.toggle_added(crn)| | Section Summary (Add/Remove button)
State.draw_course_list()| | Search Box (oninput)
State.is_filter_active(filter)| true/false|Internal
State.draw_filter()||Internal
State.updateCookies()||Internal
State.loadCookies()||Internal


## data.js
Raw data file created by `Dartmouth_Catalouge_Scrapers`. Processed by `catalogue.js` and removed from memory.

## painter.js

Functions to create HTML Templates and Calendar

## utilities.js

Calendar export / small miscellaneous helper functions / watchers
