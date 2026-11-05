# UMass Dining Hall Tracker

A web app for tracking dining hall menu items across campus.

## Setup Instructions:
```bash
gh repo clone sunnyxie29/UMass_Dining_Hall_Tracker
cd UMass_Dining_Hall_Tracker
npm install
npm install express
npm install ejs
npm start
```

Then open http://localhost:3000
Requires Node.js.

| Name          | Github      |
| ------------- | ----------- |
| Sunny Xie     | sunnyxie29  |
| Thomas Draghi | umassmilker |
| Mark Kulmizev | mkulmizev   |

Working Agreement:

1. We will communicate via the iMessage group chat that we created.

2. "Done" means that the code properly functions without throwing errors and doesn't conflict with other files (naming semantics, inputs/outputs match, etc). It doesn't even have to be 100% completed, just work as you go and commit what is needed.

3. Disagreements will be solved by kindly talking with other group members and calmly explaining what is wrong.

Project Domain:
We want to make a dining hall tracker similar to the official UMass one. This directly benefits everyone by being able to use our computers to check the dining halls (how busy they are currently, the day's menu, etc.) rather than our phones. While the phone does have some upsides, sometimes using your phone just isn't an option. So, we want to create this website to help those who need it. Beyond the classroom, it just overall helps the student body by creating a more convenient way to check the dining hall statuses.

Git clone the repository to your own computer in a container to be used. this project is a tracker made to be a web version of the UMass dining hall app on students phones. it will display food items and hours for specific dining halls to a users wishes. to run it, cd into the repository, run npm install ejs in your terminal, and then run npm start to start the server locally for you to access in your browser.

## Feature: Menu Items

### What it does

Users can add dining hall menu items, view them in a list, edit them, and delete them. Each item has three fields (this feature was designed for admins, common users will only have access to the view version):

| Field          | Description                                                    | Rules                     |
| -------------- | -------------------------------------------------------------- | ------------------------- |
| `name`         | Name of the dish                                               | Required, cannot be blank |
| `diningHallId` | Dining hall: 1 Worcester, 2 Franklin, 3 Berkshire, 4 Hampshire | Must be one of 1 to 4     |
| `section`      | Menu section, such as Breakfast or Grill                       | Required, cannot be blank |

Items are saved in `data/menu-items.json`, so they are still there after the server restarts.

### How to try it

1. Follow the setup instructions at the top of this page.
2. Then, run this command in your terminal: `npm start`.
3. Open `http://localhost:3000` in your browser.
4. Use the traversal buttons at the bottom of each page to go between each page (home page, halls page, and menu page).
5. On the menu page, you may add, edit, and delete food items freely.

### Routes

| Method | Path            | Purpose                                         | Success | Errors                           |
| ------ | --------------- | ----------------------------------------------- | ------- | -------------------------------- |
| GET    | /menu-items     | List all items                                  | 200     |                                  |
| POST   | /menu-items     | Add an item                                     | 201     | 400 invalid input                |
| PUT    | /menu-items/:id | Update an item (id is its position in the list) | 200     | 400 invalid input, 404 not found |
| DELETE | /menu-items/:id | Delete an item                                  | 204     | 404 not found                    |

All errors are returned as JSON in the form `{ "error": "message" }`, and the page shows the message to the user.

### HTMX Interaction (Sprint 3)

The menu page no longer builds its list with hand-written `fetch` calls and DOM updates. `public/app.js` is deleted. Adding, editing, and deleting items are all done with HTMX (`hx-*` attributes in the markup), and the server answers each request with an HTML fragment that HTMX swaps into the page. It is loaded from a CDN, so there is nothing extra to install.

How to see it: run `npm start`, open `http://localhost:3000/menu`, and use the page. Nothing reloads. In the browser's Network tab, each action is a request answered with HTML rather than JSON.

| Action | Element | Attributes | Server response |
| ------ | ------- | ---------- | --------------- |
| Load the list | `<ul id="items">` | `hx-get="/menu-items" hx-trigger="load"` | `partials/menu-items.ejs`, one row per item |
| Add | `#item-form` | `hx-post="/menu-items" hx-target="#items"` | The refreshed list (201) |
| Edit | the row's inline form | `hx-put="/menu-items/:id" hx-target="closest li" hx-swap="outerHTML"` | The single updated row `partials/menu-item.ejs` |
| Delete | the row's Delete button | `hx-delete="/menu-items/:id" hx-target="#items" hx-confirm` | The refreshed list |
| Show an error | `#form-error` | `HX-Retarget` and `HX-Reswap` response headers | The error message as text (400, 404) |

How it works with the existing layers:

- The routes, service, and repository are untouched. The controller checks for the `HX-Request: true` header that HTMX sends: if it is there, the controller renders a partial, and if it is not, it returns the same JSON and status codes as before. The routes table above still describes the JSON behavior.
- Errors from the service go through the same error handler. For an HTMX request it renders `partials/error.ejs` and tells HTMX to put it in `#form-error` instead of the list, so a failed save shows its message in the page and leaves the list alone.
- Every successful list or row response also carries an out-of-band element that empties `#form-error`, so an old error disappears after the next successful action.
- The dining hall dropdown options are rendered by the server from the DTO's `DINING_HALLS`, so the hall list no longer has a second copy in client-side JavaScript.

Client-facing id that assumed an array position: the old `app.js` stored each row's id as its position in the list (`li.dataset.id = list.children.length`) and re-numbered every row after a delete, because the server's ids were array positions. The server now renders each row's id into its `hx-put` and `hx-delete` URLs. Add and delete respond with the whole refreshed list, so ids are always rebuilt by the server and nothing on the client has to track a position. The controller uses `item.id`, then `item._id`, and only falls back to the array position, so the views do not change when the repository starts returning real MongoDB ids.

### Tests (Sprint 3)

Run them with:

```bash
npm install
npm test
```

All repository and service dependencies are mocked with `jest.unstable_mockModule`, so no files or database are touched.

| Test file | What it covers |
| --------- | -------------- |
| `tests/menuItemService.test.js` | Every service rule: name required (missing, empty, whitespace), dining hall must be 1 to 4 (missing, empty, out of range, non-numeric), section required (missing, empty, whitespace). Also trimming, converting form strings like `"3"` to numbers, and the 404 for update and delete of a missing item. |
| `tests/menuItemController.test.js` | A request with `HX-Request` gets the right partial and status, a request without it still gets JSON, ids come from the item or its position, and service errors reach `next`. |
| `tests/errorHandler.test.js` | JSON errors for plain requests, a retargeted HTML error for HTMX requests, and the generic message for a 500. |
| `tests/menuItemViews.test.js` | The rendered partials contain the expected `hx-delete`, `hx-put`, and `hx-target` values, preselect the right hall, escape item text, and clear the error area. |

### System Diagram

![System Diagram Image](./systemDiagrams/sprint2.png)

### Design Decisions

Sunny Xie:
We’ve designed the repository to be the sole component that reads from and writes to the `data/menu-items.json` file, rather than having the service call `fs` directly. An alternative approach could reduce the number of files: the service reads the file, applies rules, and then writes it back. While this approach works for JSON files, it blurs the distinction between service rules and the location where data is stored. If our team were to migrate to MongoDB in the future, not only would the storage code need to be rewritten, but the server-side code would also have to be rewritten, and we would be unable to test and validate the rules without access to the actual files. With the repository boundary design, however, when the storage method changes, only that file changes, while the server-side code remains unchanged. The cost is one additional file and one extra function call per operation, but I believe this cost is negligible compared to the flexibility we gain.

Thomas Draghi: For our menu item DTO and app.js, we decided to represent each dining hall as a numeric id instead of its name. The DTO holds a list of { id, name } pairs, and the dropdown shows the names but sends the ids. We decided this because if the item stored the hall’s name, a renamed hall would leave every saved item pointing at a name that no longer exists, while an id keeps pointing at the right hall. The alternative of storing the name can still be considered valid though, as it needs no lookup, has no “Unknown hall” case, and the saved data is readable on its own. Therefore, we sacrifice that simplicity in order to keep items tied to the correct hall, as the extra lookup is small and the hall list only needs to be kept in sync in two places.

Mark Kumizev:
For our menu.ejs template, we decided to make each item's dining hall and section values appear less significant (did this by making the font smaller, made the text more gray) as compared to the actual name of the dish. We decided to do this because if the items' every field had the same styling the list, the items would basically appear as just being sentences (for example: Chicken Tenders Worcester Lunch). Therefore, in an effort to present each item in a more clean way, we went down this route. The alternative of keeping the styling the same across all fields can still be considered as being valid though, as all the fields carry important information and we don't wanna give an impression that this isn't the case. Therefore, we sacrifice this way of preventing that misconception in order to present the items in a more clean way, as it should already be obvious that all fields carry important information.
  