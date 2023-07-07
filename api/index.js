import express from "express";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { Deta } from "deta";
import crypto from "crypto";
import handlebars from "handlebars";
import fs from "fs";

const app = express();
app.use(express.json());

const client = Deta(process.env.DETA_PROJECT_KEY);

app.get("/__space/actions", (req, res) => {
  res.json({
    actions: [
      {
        name: "add_note",
        title: "Add Note",
        path: "/add_note",
        input: [
          {
            name: "text",
            type: "string",
            accept: ["text"]
          }
        ],
        output: "/api/note"
      }
    ]
  });
});

app.post("/add_note", async (req, res) => {
  if (!req.body.text) {
    res.json({ ok: false, err: "No text!" });
    return;
  }

  const deta = Deta();
  const memodb = deta.Base("memos");

  const key = crypto.randomUUID();
  await memodb.put(
    {
      position: {
        left: 200,
        top: 200
      },
      size: {
        height: 200,
        width: 400
      },
      text: `Saved Summary (${new Date().toLocaleDateString()}):\n\n${req.body.text}`
    },
    key
  );

  res.json({ ok: true, noteKey: key });
});

app.get("/note", async (req, res) => {
  const q = JSON.parse(req.query.input);

  const memodb = client.Base("memos");
  const note = await memodb.get(q.noteKey);

  const contents = fs.readFileSync(dirname(fileURLToPath(import.meta.url)) + "/card.html", "utf8");
  const template = handlebars.compile(contents);
  res.send(
    template({
      noteContent: note.text // req.query.input
    })
  );
  // res.sendFile(dirname(fileURLToPath(import.meta.url)) + "/card.html");
  // res.send("Hello World!");
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}`));

// http://localhost:4201/?input=%7B%22summary%22%3A%20%22Lorem%20ipsum%20dolor%20sit%20amet%2C%20consectetur%20adipiscing%20elit%2C%20sed%20do%20eiusmod%20tempor%20incididunt%20ut%20labore%20et%20dolore%20magna%20aliqua.%20In%20fermentum%20et%20sollicitudin%20ac%20orci.%20Sodales%20ut%20eu%20sem%20integer%20vitae%20justo.%20Sit%20amet%20massa%20vitae%20tortor.%20Lectus%20magna%20fringilla%20urna%20porttitor%20rhoncus.%20Scelerisque%20felis%20imperdiet%20proin%20fermentum%20leo%20vel%20orci%20porta%20non.%20Sed%20arcu%20non%20odio%20euismod.%20%5CnAmet%20facilisis%20magna%20etiam%20tempor%20orci.%20Tincidunt%20tortor%20aliquam%20nulla%20facilisi%20cras%20fermentum%20odio%20eu.%20Arcu%20dictum%20varius%20duis%20at%20consectetur%20lorem%20donec.%20Porta%20lorem%20mollis%20aliquam%20ut%20porttitor%20leo%20a.%20%5CnConsequat%20mauris%20nunc%20congue%20nisi%20vitae%20suscipit.Sit%20amet%20tellus%20cras%20adipiscing%20enim%20eu%20turpis%20egestas%20pretium.%20Integer%20feugiat%20scelerisque%20varius%20morbi%20enim%20nunc%20faucibus.%20Porta%20nibh%20venenatis%20cras%20sed%20felis%20eget.%20Lectus%20proin%20nibh%20nisl%20condimentum%20id.%20Diam%20sit%20amet%20nisl%20suscipit.%20Quam%20id%20leo%20in%20vitae%20turpis.%20Proin%20nibh%20nisl%20condimentum%20id%20venenatis%20a.%20Metus%20vulputate%20eu%20scelerisque%20felis.%20Venenatis%20cras%20sed%20felis%20eget%20velit%20aliquet%20sagittis%20id.%20In%20iaculis%20nunc%20sed%20augue%20lacus%20viverra%20vitae%20congue%20eu.%22%7D
