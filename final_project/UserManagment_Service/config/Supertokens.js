const supertokens = require("supertokens-node");
const Session = require("supertokens-node/recipe/session");
const EmailPassword = require("supertokens-node/recipe/emailpassword");
const pool = require("../db"); // Import PostgreSQL connection

supertokens.init({
    supertokens: {
        connectionURI: "http://supertokens-core:3567", // Connect to the SuperTokens Core service in Docker
    },
    appInfo: {
        appName: "User Service",
        apiDomain: "http://localhost:3000", // Ensure this is the correct domain
        websiteDomain: "http://localhost:3000", // Ensure this is the correct domain
        apiBasePath: "/auth", // The base path for your API
    },
    recipeList: [
        EmailPassword.init({
            override: {
                apis: (originalImplementation) => {
                    return {
                        // Overriding signUpPOST API to add custom behavior for user registration
                        ...originalImplementation,
                        signUpPOST: async (input) => {
                            if (originalImplementation.signUpPOST === undefined) {
                                throw Error("SignUpPOST API not available");
                            }

                            // Call SuperTokens' original signup logic
                            const response = await originalImplementation.signUpPOST(input);

                            // Safely log relevant parts of the SuperTokens response
                            console.log("SuperTokens Response (User Data):", {
                                status: response.status,
                                userId: response.user?.id,
                                email: response.user?.loginMethods?.[0]?.email,
                                timeJoined: response.user?.timeJoined
                            });

                            if (response.status === "OK") {
                                const id = response.user.id;
                                const email = response.user.loginMethods[0]?.email;

                                try {
                                    // Insert user into PostgreSQL
                                    await pool.query(
                                        "INSERT INTO users (id, email, password_hash) VALUES ($1, $2, $3)",
                                        [id, email, "hashed-by-supertokens"]
                                    );
                                    console.log("User successfully added to PostgreSQL");

                                    // Insert log for signup action
                                    await pool.query(
                                        "INSERT INTO logs (user_id, action) VALUES ($1, $2)",
                                        [id, "signup"]
                                    );
                                    console.log("Log inserted into PostgreSQL for signup");

                                } catch (error) {
                                    console.error("Error adding user to PostgreSQL or inserting log:", error);
                                }
                            } else {
                                console.error("SuperTokens signup failed:", response);
                            }

                            return response;
                        },

                        // Overriding signInPOST API to handle login functionality
                        signInPOST: async (input) => {
                            console.log("SignInPOST request received:", input);  // Log to confirm the request is being handled
                            if (originalImplementation.signInPOST === undefined) {
                                throw Error("SignInPOST API not available");
                            }

                            // Call SuperTokens' original login logic
                            const response = await originalImplementation.signInPOST(input);

                            // Log the response for debugging
                            console.log("SuperTokens Response (Login Data):", {
                                status: response.status,
                                userId: response.user?.id,
                                email: response.user?.loginMethods?.[0]?.email,
                                timeJoined: response.user?.timeJoined
                            });

                            if (response.status === "OK") {
                                const id = response.user.id;
                                const email = response.user.loginMethods[0]?.email;

                                try {
                                    // Insert log for login action
                                    await pool.query(
                                        "INSERT INTO logs (user_id, action) VALUES ($1, $2)",
                                        [id, "login"] // Log the action as login
                                    );
                                    console.log("Log inserted into PostgreSQL for login");

                                } catch (error) {
                                    console.error("Error inserting log for login:", error);
                                }
                            } else {
                                console.error("SuperTokens login failed:", response);
                            }

                            return response;
                        },

                    };
                },
            },
        }),
        Session.init(),
    ],
});
