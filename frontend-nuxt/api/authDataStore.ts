import { ref } from "vue";

const user = ref("");
const displayName = ref("");
const userType = ref("");
const passwordSet = ref(false);
const isAdmin = ref(false);
const signedIn = ref(false);
const loaded = ref(false);
export default {
  user,
  displayName,
  userType,
  passwordSet,
  isAdmin,
  signedIn,
  loaded,
};
