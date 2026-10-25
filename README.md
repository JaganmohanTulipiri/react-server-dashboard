# OpsOne

Unified DevOps Platform

The Server Connect panel offers two SSH authentication options:

- Choose sample project data for **Fitness**, **WDO**, **Rely**, or **GLL** in **DEV** or **UAT**. The server name is prefilled from the selection and can be edited.
- Add a custom project with **+ Add new project**; project names are saved in browser storage for later use.
- **PEM private key**: select a `.pem` or `.key` file and provide the host, port, and SSH username.
- **Direct SSH**: provide the host, port, username, and SSH password.
- Clicking **Connect to server** first validates the form, then plays a flying robot animation before saving the demo connection.
- To add the GLL example without a CSV file, choose **Load GLL sample servers**. It adds 5 DEV, 5 UAT, and 10 PROD sample profiles with the placeholder username `ubuntu` and reserved documentation IPs. These are not real servers; replace them with your connection details before use. Alternatively, bulk import with a CSV using columns `Project,ServerName,Environment,Host,Port,Username,Authentication`. Supply any PEM private key separately when establishing a live connection; never store passwords or keys in the CSV. Environment may be `DEV`, `UAT`, or `PROD`, and authentication may be `PEM` or `Direct SSH`. Each row becomes a saved, disconnected profile grouped by project, server, and environment. Existing project/server/environment rows are skipped.
- After connecting, server connection details are saved in browser storage and grouped in the sidebar by **Project → Environment → Server**. Click a project name (such as **GLL**) to expand or collapse its environment groups, then click **DEV**, **UAT**, or **PROD** to expand or collapse just that environment's servers. Disconnecting keeps the saved entry; use **Reconnect** on it to reuse its saved non-secret details without filling the form again. Choose **New Server Connection** for a fresh form. The project/server list scrolls independently of the rest of the page.

These are currently frontend demo forms only. The app saves connection metadata in browser storage, but does not save passwords or private-key contents, send credentials, or open an SSH session. Reconnect only updates the demo status; live SSH access requires a secure backend to handle authentication and connection management.