
import * as registration from './specimens/registration.js';
import * as passwordRecovery from './specimens/password-recovery.js';
import * as profile from './specimens/profile.js';
import * as notifications from './specimens/notifications.js';
import * as booking from './specimens/booking.js';
import * as eventRegistration from './specimens/event-registration.js';
import * as search from './specimens/search.js';
import * as productFilters from './specimens/product-filters.js';
import * as shoppingCart from './specimens/shopping-cart.js';
import * as checkout from './specimens/checkout.js';
import * as fileManager from './specimens/file-manager.js';
import * as fileUpload from './specimens/file-upload.js';
import * as dashboard from './specimens/dashboard.js';
import * as dataTable from './specimens/data-table.js';
import * as map from './specimens/map.js';
import * as mediaPlayer from './specimens/media-player.js';
import * as messaging from './specimens/messaging.js';
import * as permissions from './specimens/permissions.js';
import * as helpCentre from './specimens/help-centre.js';
import * as cancellation from './specimens/cancellation.js';
import * as courseenrolment from './specimens/course-enrolment.js';
import * as travelbooking from './specimens/travel-booking.js';
import * as foodordering from './specimens/food-ordering.js';
import * as alarmtimer from './specimens/alarm-timer.js';
import * as documenteditor from './specimens/document-editor.js';
import * as cloudsharing from './specimens/cloud-sharing.js';
import * as weatherapp from './specimens/weather-app.js';
import * as publictransport from './specimens/public-transport.js';
import * as bankingtransfer from './specimens/banking-transfer.js';
import * as subscriptionmanagement from './specimens/subscription-management.js';
import * as photolibrary from './specimens/photo-library.js';
import * as kanbanboard from './specimens/kanban-board.js';
import * as smarthome from './specimens/smart-home.js';
import * as surveyquestionnaire from './specimens/survey-questionnaire.js';
import * as videomeeting from './specimens/video-meeting.js';
import * as learningmodule from './specimens/learning-module.js';
import * as restaurantreservation from './specimens/restaurant-reservation.js';
import * as ecommercereturns from './specimens/ecommerce-returns.js';
import * as accessibilitysettings from './specimens/accessibility-settings.js';
import * as systemupdate from './specimens/system-update.js';
import * as streamingTrial from './specimens/streaming-trial.js';
import * as travelAddons from './specimens/travel-addons.js';
import * as privacyConsent from './specimens/privacy-consent.js';
import * as fashionSale from './specimens/fashion-sale.js';
import * as subscriptionCancellation from './specimens/subscription-cancellation.js';
import * as productivityApp from './specimens/productivity-app.js';
import * as darkCheckout from './specimens/dark-checkout.js';
import * as newsMedia from './specimens/news-media.js';
import * as marketplace from './specimens/marketplace.js';
import * as softwareDownload from './specimens/software-download.js';

const implementations = {
    registration,
    'password-recovery': passwordRecovery,
    profile,
    notifications,
    booking,
    'event-registration': eventRegistration,
    search,
    'product-filters': productFilters,
    'shopping-cart': shoppingCart,
    checkout,
    'file-manager': fileManager,
    'file-upload': fileUpload,
    dashboard,
    'data-table': dataTable,
    map,
    'media-player': mediaPlayer,
    messaging,
    permissions,
    'help-centre': helpCentre,
    cancellation,
    'course-enrolment': courseenrolment,
    'travel-booking': travelbooking,
    'food-ordering': foodordering,
    'alarm-timer': alarmtimer,
    'document-editor': documenteditor,
    'cloud-sharing': cloudsharing,
    'weather-app': weatherapp,
    'public-transport': publictransport,
    'banking-transfer': bankingtransfer,
    'subscription-management': subscriptionmanagement,
    'photo-library': photolibrary,
    'kanban-board': kanbanboard,
    'smart-home': smarthome,
    'survey-questionnaire': surveyquestionnaire,
    'video-meeting': videomeeting,
    'learning-module': learningmodule,
    'restaurant-reservation': restaurantreservation,
    'ecommerce-returns': ecommercereturns,
    'accessibility-settings': accessibilitysettings,
    'system-update': systemupdate,
    'streaming-trial': streamingTrial,
    'travel-addons': travelAddons,
    'privacy-consent': privacyConsent,
    'fashion-sale': fashionSale,
    'subscription-cancellation': subscriptionCancellation,
    'productivity-app': productivityApp,
    'dark-checkout': darkCheckout,
    'news-media': newsMedia,
    'marketplace': marketplace,
    'software-download': softwareDownload,
};

export async function loadSpecimens() {
    const response = await fetch('./data/specimens.json');
    if (!response.ok) throw new Error('Could not load specimen library.');
    return response.json();
}

export async function loadIssues() {
    const response = await fetch('./data/issues.json');
    if (!response.ok) throw new Error('Could not load issue library.');
    return response.json();
}

export function renderSpecimen(root, specimen) {
    const implementation = implementations[specimen.implementation];

    if (!implementation || typeof implementation.render !== 'function') {
        root.innerHTML = `
            <div class="specimen-render-error">
                <strong>SPECIMEN IMPLEMENTATION UNAVAILABLE</strong>
                <p>${specimen.id} / ${specimen.name}</p>
                <small>Implementation: ${specimen.implementation}</small>
            </div>`;
        console.error(`Missing implementation for ${specimen.id}: ${specimen.implementation}`);
        return null;
    }

    try {
        implementation.render(root);
        return implementation;
    } catch (error) {
        root.innerHTML = `
            <div class="specimen-render-error">
                <strong>SPECIMEN RENDER ERROR</strong>
                <p>${specimen.id} / ${specimen.name}</p>
                <small>${error.message}</small>
            </div>`;
        console.error(`Failed to render ${specimen.id}`, error);
        return null;
    }
}
