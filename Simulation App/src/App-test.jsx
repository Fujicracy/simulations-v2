import React, { useState } from 'react';

export default function App() {
   const [gender,setGender]=useState('');

   const handleChange=(e)=>{
       setGender( e.target.value);
    }

    return (
      <div>
         <form>
             <input type="radio" value="male" id="male"
               onChange={handleChange} name="gender" />
             <label for="male">Male</label>

            <input type="radio" value="female" id="female"
              onChange={handleChange} name="gender"/>
            <label for="female">Female</label>
         </form>

         <p>You gender is --> {gender}</p>
      </div>
    );
}