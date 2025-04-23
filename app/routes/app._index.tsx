import { Form, useActionData } from "@remix-run/react";
import { json, redirect } from "@remix-run/node";
import { db } from "~/db.server"; 


export default function AppIndex() {


  return (
    <div style={{ maxWidth: "600px", margin: "auto", padding: "20px", textAlign: "center" }}>
      <h1>Boxy APP</h1>
    </div>
  );
}
