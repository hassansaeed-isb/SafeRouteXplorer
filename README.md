# SafeRouteXplorer
## README

**Follow these steps to set up and run the project:**

### 1. Fork the Repository

- Go to the original repository page on GitHub.
- Click the **Fork** button in the top-right corner.
- Choose your GitHub account as the destination.
- Wait for GitHub to create your fork. You will now have a copy of the repository under your account.

### 2. Clone Your Fork

- On your forked repository page, click the **Code** button and copy the URL.
- Open your terminal and run:

  ```
  git clone https://github.com/your-username/SafeRouteXplorer.git
  cd SafeRouteXplorer
  ```

  Replace `your-username` with your actual GitHub username and the repository name.

### 3. Switch to the `alert-fix` Branch

- Create a new branch for your changes:

  ```
  git checkout -b alert-fix
  ```

### 4. Install Requirements

- Make sure you have Python and pip installed.
- Install all required packages using the provided `requirements.txt` file:

  ```
  pip install -r requirements.txt
  ```

  This will install all dependencies needed to run the project.

### 5. Run the Application

- Start the application by running:

  ```
  python app.py
  ```

  Make sure you are in the project directory when running this command.

---

**Summary of Commands**

```sh
# Fork the repo on GitHub, then:
git clone https://github.com/your-username/SafeRouteXplorer.git
cd repository-name
git checkout -b alert-fix
pip install -r requirements.txt
python app.py
```

---

**Notes:**
- If you encounter issues with `python app.py`, try `python3 app.py` depending on your environment.
- Ensure you are in the root directory where `requirements.txt` and `app.py` are located when running the commands