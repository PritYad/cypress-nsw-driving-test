/// <reference types="cypress" />
const url = Cypress.env("loginUrl");
const id = Cypress.env("bookingNumber"); // enter your booking number
const lname = Cypress.env("lastName"); // enter your lastName
const dateList = {};
let bookedDate = '';
const datesId = '.rms_timeSelPick .rms_timeSelTitle th';
const availableId = '.rms_timeSelPick td .available';
const previousBTnId = 'span[id="prevWeekButton_label';
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
let message = '';
const timeList = [
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
  '2:00 pm'
];
const lessTrafficTimes = Cypress.env('avoidTrafficTime') ? timeList : [];

describe('Actions', () => {
  it('.type() - type into a DOM element', () => {
    cy.visit(url);
    cy.contains('Booking number');
    cy.get('.dijitInputContainer input:first').click().clear().type(id).blur();
    cy.get('input[id="widget_input_familyName"]').click().clear().type(lname).blur();
    cy.get('span[id="submitNoLogin_label"]').click();
    getBookingDate();
    cy.get('span[widgetid="changeTimeButton"]').click();
    findAvailableSlots();
    goToPreviousWeek();
  });
});

function getBookingDate() {
  cy.get('table[summary="Details about the time and date of the test."] tr').then((ele) => {
    if (ele.length) {
      bookedDate = new Date(ele[0].querySelector('td').innerText);
      let bookingTime = convertTime12to24(ele[1].querySelector('td').innerText).split(':');
      bookedDate.setHours(bookingTime[0]);
      bookedDate.setMinutes(bookingTime[1]);
      console.log({
        new: 'Your current booking date',
        time: bookedDate
      });
    }
  });

}

function findAvailableSlots() {
  cy.get('form[id="rms_testGroupWrapper"]').then((ele) => {
    if (ele[0].querySelectorAll('.minimalPopup').length === 0) {
      fetchDateList();
      fetchAvailableSlots(ele);
    }
  });
}

function fetchAvailableSlots() {
  cy.get(availableId).then((ele) => {
    if (ele.toArray().length) {
      ele.toArray().forEach(element => {
        const aDate = getSlotDate(element.parentElement.className, element.innerText);
        if (bookedDate > aDate) {
          if (lessTrafficTimes.length === 0) {
            slots.push(`${aDate.toLocaleString()}`);
          } else if (
            lessTrafficTimes.length > 0 &&
            lessTrafficTimes.includes(element.innerText)) {
            slots.push(`${aDate.toLocaleString()}`);
          }
        }
      });
    }

  });
}

function goToPreviousWeek() {
  cy.get('span[widgetid="prevWeekButton"]').then((ele) => {
    if (!ele[0].querySelector('span[id="prevWeekButton"]').disabled) {
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
        message = `Available booking slots are ${slots.join(';')}`;
        alert(message);
      } else {
        message = `Sorry No available booking found before ${bookedDate}`;
      }
      cy.wait(500);
      logout();
    }
  });
}

function searchAnotherLocation() {
  cy.get('a[id="anotherLocationLink"]').click();
  cy.get('label[id="labelrms_batLocLocSel"]').click();
  cy.get('select[id="rms_batLocationSelect2"]').click();
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


const convertTime12to24 = (time12h) => {
  const [time, modifier] = time12h.split(' ');

  let [hours, minutes] = time.split(':');

  if (hours === '12') {
    hours = '00';
  }

  if (modifier.toUpperCase() === 'PM') {
    hours = parseInt(hours, 10) + 12;
  }

  return `${hours}:${minutes}`;
}
