import { supabase } from '../../supabaseConfig';


export const signUpWithEmail = async (email, password, name) => {
    try{
        const {data, error} = await supabase.auth.signUp({
                email,
                password,
                options: {
                data: {
                    name: name,
                }
            }
        });
        if (error) throw error;
        if(data.user){
            console.log('user created: ',data.user.email);
            try{
                const signInResult = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (signInResult.error) {
                    console.warn('sign in problem',signInResult.error.message);
                } else {
                    console.log("auto logged in");
                    const sessionUser= signInResult.data.user;
                    if (sessionUser) {
                        const normalizedUser = {
                            ...sessionUser,
                            uid: sessionUser.id,
                            displayName: sessionUser.user_metadata?.name || name,
                        };
                        return normalizedUser;
                    }
                }
            }
            catch(signInError){
                throw signInError;
            }
        }
        const normalizedUser = {
          ...data.user,
          uid: data.user.id, 
          displayName: data.user.user_metadata?.name || name,
        };
        
        //if it fails this is the user that was created but it just didnt auto sign in
        return normalizedUser;

        
    }
    catch (error){
        throw error;
    }
    


}





export const signInWithEmail = async (email, password) => {
    try{
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        if (error) throw error;
        if (data.user) {
        const normalizedUser = {
            ...data.user,
            uid: data.user.id,
            displayName: data.user.user_metadata?.name
        };
        return normalizedUser;
    }
    

    }
    catch (error) {
        console.error('login fail', error);
        throw error;
    }
}