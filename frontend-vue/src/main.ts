import { createApp } from 'vue';
import App from './App.vue';
import router from './router/index';
import PrimeVue from 'primevue/config';
import ToastService from 'primevue/toastservice';
import Aura from '@primevue/themes/aura';
import './assets/main.css';
import axios from 'axios';
import Tooltip from 'primevue/tooltip';
import { createPinia } from 'pinia';

/* Import FontAwesome core */
import { library } from '@fortawesome/fontawesome-svg-core';
/* Import Font Awesome Icon component */
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
/* Import specific icons */
import {
  faXTwitter,
  faFacebook,
  faLinkedin,
  faInstagram,
  faTiktok,
  faYoutube,
  faThreads,
  faBluesky,
  faMastodon,
  faPinterest,
} from '@fortawesome/free-brands-svg-icons';
import {
  faCheck,
  faCalendar,
  faRocket,
  faShareNodes,
  faUser,
} from '@fortawesome/free-solid-svg-icons';

axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL;
axios.defaults.withCredentials = true;

/* Add icons to the library */
library.add(
  faXTwitter,
  faFacebook,
  faLinkedin,
  faInstagram,
  faTiktok,
  faYoutube,
  faThreads,
  faBluesky,
  faMastodon,
  faPinterest,
  faCheck,
  faCalendar,
  faRocket,
  faShareNodes,
  faUser
);

const app = createApp(App);
const pinia = createPinia();

app
  .component('font-awesome-icon', FontAwesomeIcon)
  .use(router)
  .use(PrimeVue, {
    theme: {
      preset: Aura,
    },
  })
  .use(ToastService)
  .use(pinia);

app.directive('tooltip', Tooltip);

app.mount('#app');
