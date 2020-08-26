/// <reference types="cypress" />
const url = 'https://www.myrta.com/wps/portal/extvp/myrta/licence/tbs/tbs-change/!ut/p/b1/lc7fboIwFAbwZ_EBTP8p1MsiCN1EECyD3hBWWIODmm2OuLcf3pg';
const id = "";
const lname = '';
const dateList = {};
let bookedDate = '';
const noBooking = 'There are no timeslots available for this week.';
const selected = '.rms_timeSelPick td .selected';
const datesId = '.rms_timeSelPick .rms_timeSelTitle th';
const availableId = '.rms_timeSelPick td .available';
const previousBTnId = 'span[id="prevWeekButton_label';
const nextBTnId = 'span[id="nextWeekButton_label';
let slots = [];
const currentDate = new Date();
const currentYear = currentDate.getFullYear();
const days = {
  0: `Sun`,
  1: `Mon`,
  2: `Tue`,
  3: `Wed`,
  4: `Thu`,
  5: `Fri`,
  6: `Sat`
};
const currentMonth = currentDate.getMonth() < 9 ? `0${currentDate.getMonth() + 1}` : `${currentDate.getMonth() + 1}`;
const nearestDay = `${days[currentDate.getDay()]} ${currentDate.getDate()}/${currentMonth}`;

const lessTrafficTimes = [
  '9:30 am',
  '9:45 am',
  '10:00 am',
  '10:30 am',
  '10:45 am',
  '11:00 am',
  '11:30 am',
  '11:45 am',
  '12:00 pm',
  '12:30 pm',
  '12:45 pm',
  '1:00 pm',
  '1:30 pm',
  '1:45 pm',
  '2:00 pm',
  '2:15 pm'
];

describe('Actions', () => {
  it('.type() - type into a DOM element', () => {
    cy.visit(url);
    cy.contains('Booking number');
    cy.get('.dijitInputContainer input:first').click().clear().type(id).blur();
    cy.get('input[id="widget_input_familyName"]').click().clear().type(lname).blur();
    cy.get('span[id="submitNoLogin_label"]').click();
    cy.get('span[widgetid="changeTimeButton"]').click();

    fetchDateList();
    if (dateList !== undefined && dateList !== '' && dateList !== null) {
      cy.get(selected).then((ele) => {
        bookedDate = getSlotDate(ele[0].parentElement.className, ele[0].innerText);
        console.log('booking date')
        console.log(bookedDate);
        findAvailableSlots();
      });
      goToPreviousWeek();
    }
  });
});

function findAvailableSlots() {
  cy.get('form[id="rms_testGroupWrapper"]').then((ele) => {
    if (ele[0].querySelectorAll('.minimalPopup').length === 0) {
      fetchDateList();
      fetchAvailableSlots(ele);
    }
  });
}

function fetchAvailableSlots(ele) {
  cy.get(availableId).then((ele) => {
    if (ele.toArray().length) {
      ele.toArray().forEach(element => {
        const aDate = getSlotDate(element.parentElement.className, element.innerText);
        if (bookedDate > aDate && lessTrafficTimes.includes(element.innerText)) {
          slots.push(`${aDate} ${element.innerText}`)
        }
      });
    }

  });
}

function goToPreviousWeek() {
  var exists = Object.keys(dateList).some(function (k) {
    return dateList[k] === nearestDay;
  });
  if (!exists) {
    cy.get(previousBTnId).then(() => {
      cy.get(previousBTnId).click();
      fetchDateList();
      findAvailableSlots();
      goToPreviousWeek();
    });
  } else {
    findAvailableSlots();
    if (slots.length) {
      console.log(slots);
      const times = document.createDocumentFragment();
      const heading = document.createElement("div");
      heading.innerHTML = "Available booking slots are as below:\n";
      times.appendChild(heading);
      const ol = document.createElement("ol");
      slots.forEach(ele => {
        const li = document.createElement("li");
        li.innerHTML = `${ele}\n`;
        ol.appendChild(li);
      });
      times.appendChild(ol);
      alert(times.textContent);
    } else {
      alert(`No available booking found between ${lessTrafficTimes[0]} to ${lessTrafficTimes[lessTrafficTimes.length - 1]} before ${bookedDate}`);
    }
    logout();
  }
}
function logout() {
  cy.get('span[id="closeButton"]').click();
  cy.get('div[id="logoutConfirmPopup"]').as('logout');
  cy.get('@logout').get('[id="modalExit"]:first').click({ force: true });
}

function fetchDateList() {
  cy.get(datesId).then((date) => {
    date.toArray().forEach(ele => {
      dateList[ele.className] = ele.innerText;
    });
  });
}

function getSlotDate(className, innerText) {
  const dateOfBooking = dateList[className];
  dateOfBooking = dateOfBooking.replace(' ', '/').split('/');
  const availableDate = {
    date: Number(dateOfBooking[1]),
    month: Number(dateOfBooking[2])
  }
  return new Date(`${currentYear}/${availableDate.month}/${availableDate.date} ${innerText}`);
}
