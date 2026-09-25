import axios from "axios";
import { useState } from "react";
import * as XLSX from "xlsx";
import "./App.css";

function App() {

const [name ,setName]=useState("")
const [file, setFile] = useState(null)
const [status ,setStatus]=useState(false)
const[emailList ,setEmailList]=useState([])

const API_URL = import.meta.env.VITE_API_URL || "https://bulkmailer-5urk.onrender.com";

const handleAdd = async () => {
    setStatus(true)
    try {

      const response = await axios.post(`${API_URL}/`, {msg:name,emailList:emailList});
      console.log("Server response:", response.data);
      alert("Email sent successfully!");
    } catch (error) {
      console.error("Error sending request:", error);
      alert(`Failed to send email: ${error.response?.data?.error || error.message}`);
    } finally {
      setStatus(false)
    }
    setName("");
    setFile(null);
    setEmailList([]);
  };
const handleFile=(e)=>{
  const selectedFile=e.target.files[0]
  if (!selectedFile) return;

  setFile(selectedFile);

        const reader =new FileReader();

        reader.onload=(e)=>{
            const data = e.target.result
            const workbook= XLSX.read(data,{type:"binary"})
            const sheetName= workbook.SheetNames[0]
            const  workSheet =workbook.Sheets[sheetName]
          const rows = XLSX.utils.sheet_to_json(workSheet, { header: 1 })
          const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          const allEmail = rows
            .flat()
            .map((value) => String(value).trim())
            .filter((value) => emailPattern.test(value))
          setEmailList(allEmail)
          console.log("Email recipients:", allEmail)
        }
        reader.readAsBinaryString(selectedFile)
      }
           
       


  return (
    <main className="mailer-page">
      <header className="mailer-header">BulkMail</header>
      <section className="mailer-content">
        <p className="tagline">We can help your business with sending multiple emails at once</p>
        <h1>Drag and Drop</h1>

        <form className="mailer-form" onSubmit={(event) => {
          event.preventDefault();
          handleAdd();
        }}>
          <label className="message-label" htmlFor="message">Email message</label>
          <textarea
            id="message"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Enter the email text..."
          />

          <label className="file-dropzone" htmlFor="spreadsheet">
            <span className="file-icon" aria-hidden="true">↑</span>
            <span>{file ? file.name : "Choose an Excel file"}</span>
            <input id="spreadsheet" type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} />
          </label>

          <p className="email-count">Total emails in the file: <strong>{emailList.length}</strong></p>
          <button className="send-button" type="submit" disabled={status || !name.trim() || !file || !emailList.length}>
            {status ? "Sending..." : "Send"}
          </button>
        </form>
      </section>
    </main>
  )

}
export default App
