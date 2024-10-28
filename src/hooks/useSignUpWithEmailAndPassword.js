import { useCreateUserWithEmailAndPassword } from "react-firebase-hooks/auth";
import { auth, firestore } from "../firebase/firebase";
import { collection, doc, getDocs, query, setDoc, where } from "firebase/firestore";
import useShowToast from "./useShowToast";
import useAuthStore from "../store/authStore";

const useSignUpWithEmailAndPassword = () => {
	const [createUserWithEmailAndPassword, , loading, error] = useCreateUserWithEmailAndPassword(auth);
	const showToast = useShowToast();
	const loginUser = useAuthStore((state) => state.login);

	const signup = async (inputs) => {
		// Vérification des champs requis
		if (!inputs.email || !inputs.password || !inputs.username || !inputs.fullName) {
			showToast("Error", "Please fill all the fields", "error");
			return;
		}

		const usersRef = collection(firestore, "users");

		// Vérification de l'unicité du nom d'utilisateur
		const usernameQuery = query(usersRef, where("username", "==", inputs.username));
		const usernameSnapshot = await getDocs(usernameQuery);

		if (!usernameSnapshot.empty) {
			showToast("Error", "Username already exists", "error");
			return;
		}

		// Vérification de l'unicité de l'email
		const emailQuery = query(usersRef, where("email", "==", inputs.email));
		const emailSnapshot = await getDocs(emailQuery);

		if (!emailSnapshot.empty) {
			showToast("Error", "Email already in use", "error");
			return;
		}

		try {
			// Création du nouvel utilisateur avec Firebase Auth
			const newUser = await createUserWithEmailAndPassword(inputs.email, inputs.password);
			if (!newUser && error) {
				showToast("Error", error.message, "error");
				return;
			}
			if (newUser) {
				// Création du document utilisateur dans Firestore
				const userDoc = {
					uid: newUser.user.uid,
					email: inputs.email,
					username: inputs.username,
					fullName: inputs.fullName,
					bio: "",
					profilePicURL: "",
					followers: [],
					following: [],
					posts: [],
					createdAt: Date.now(),
				};
				await setDoc(doc(firestore, "users", newUser.user.uid), userDoc);
				localStorage.setItem("user-info", JSON.stringify(userDoc));
				loginUser(userDoc);
			}
		} catch (error) {
			showToast("Error", error.message, "error");
		}
	};

	return { loading, error, signup };
};

export default useSignUpWithEmailAndPassword;