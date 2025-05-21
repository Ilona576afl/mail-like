
document.addEventListener('DOMContentLoaded', function () {
    load_mailbox('inbox');
});

function compose_email(recipients = '', subject = '', body = '') {
    document.querySelector('#view').innerHTML = `
        <h3>New Email</h3>
        <form id="compose-form">
            To: <input type="email" id="compose-recipients" value="${recipients}"><br>
            Subject: <input type="text" id="compose-subject" value="${subject}"><br>
            Body:<br><textarea id="compose-body" rows="6">${body}</textarea><br>
            <button type="submit">Send</button>
        </form>
    `;
    document.querySelector('#compose-form').onsubmit = send_email;
}

function send_email(event) {
    event.preventDefault();
    fetch('/emails', {
        method: 'POST',
        body: JSON.stringify({
            recipients: document.querySelector('#compose-recipients').value,
            subject: document.querySelector('#compose-subject').value,
            body: document.querySelector('#compose-body').value
        }),
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(() => load_mailbox('sent'));
}

function load_mailbox(mailbox) {
    document.querySelector('#view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
    fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
        emails.forEach(email => {
            const div = document.createElement('div');
            div.innerHTML = `<strong>${email.sender}</strong> → ${email.subject} <span style="float:right;">${email.timestamp}</span>`;
            div.style.border = "1px solid gray";
            div.style.padding = "8px";
            div.style.marginBottom = "5px";
            div.style.backgroundColor = email.read ? "#f0f0f0" : "white";
            div.style.cursor = "pointer";
            div.onclick = () => view_email(email.id);
            document.querySelector('#view').appendChild(div);
        });
    });
}

function view_email(id) {
    fetch(`/emails/${id}`)
    .then(response => response.json())
    .then(email => {
        document.querySelector('#view').innerHTML = `
            <h3>${email.subject}</h3>
            <p><strong>From:</strong> ${email.sender}</p>
            <p><strong>To:</strong> ${email.recipients.join(", ")}</p>
            <p><strong>Time:</strong> ${email.timestamp}</p>
            <hr>
            <p>${email.body}</p>
            <hr>
            ${!email.archived ? `<button onclick="archive_email(${id}, true)">Archive</button>` :
                                 `<button onclick="archive_email(${id}, false)">Unarchive</button>`}
            <button onclick="reply_email(${id})">Reply</button>
        `;

        fetch(`/emails/${id}/update`, {
            method: 'PUT',
            body: JSON.stringify({ read: true }),
            headers: {
                'Content-Type': 'application/json'
            }
        });
    });
}

function archive_email(id, archive) {
    fetch(`/emails/${id}/update`, {
        method: 'PUT',
        body: JSON.stringify({ archived: archive }),
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(() => load_mailbox('inbox'));
}

function reply_email(id) {
    fetch(`/emails/${id}`)
    .then(response => response.json())
    .then(email => {
        const subject = email.subject.startsWith("Re:") ? email.subject : `Re: ${email.subject}`;
        const body = `

On ${email.timestamp}, ${email.sender} wrote:
${email.body}`;
        compose_email(email.sender, subject, body);
    });
}
