var tasks = {};

// ==============CREATE TASK======================

var createTask = function (taskText, taskDate, taskList) {
  // create elements that make up a task item
  var taskLi = $("<li>").addClass("list-group-item");
  var taskSpan = $("<span>")
    .addClass("badge badge-primary badge-pill")
    .text(taskDate);
  var taskP = $("<p>").addClass("m-1").text(taskText);

  // append span and p element to parent li
  taskLi.append(taskSpan, taskP);

  // check due date
  auditTask(taskLi);

  // append to ul list on the page
  $("#list-" + taskList).append(taskLi);
};

// ==============================================

// ==============LOAD TASK======================

var loadTasks = function () {
  tasks = JSON.parse(localStorage.getItem("tasks"));

  // if nothing in localStorage, create a new object to track all task status arrays
  if (!tasks) {
    tasks = {
      toDo: [],
      inProgress: [],
      inReview: [],
      done: [],
    };
  }

  // loop over object properties
  $.each(tasks, function (list, arr) {
    // then loop over sub-array
    arr.forEach(function (task) {
      createTask(task.text, task.date, list);
    });
  });
};

var saveTasks = function () {
  localStorage.setItem("tasks", JSON.stringify(tasks));
};

// ==============================================

// ==============AUDIT TASKS======================

var auditTask = function (taskEl) {
  var date = $(taskEl).find("span").text().trim();

  var time = moment(date, "L").set("hour", 17);

  $(taskEl).removeClass("list-group-item-warning list-group-item-danger");

  if (moment().isAfter(time)) {
    $(taskEl).addClass("list-group-item-danger");
  } else if (Math.abs(moment().diff(time, "days")) <= 2) {
    $(taskEl).addClass("list-group-item-warning");
  }
};

// ===============================================

// ===============AUDIT TASKS SO OFTEN==============

setInterval(function () {
  $(".card .list-group-item").each(function (index, el) {
    auditTask(el);
  });
}, 180000);

// ===============================================

// ===========CLICK AND BLUR TEXT============
$(".list-group").on("click", "p", function () {
  var text = $(this).text().trim();
  var textInput = $("<textarea>").addClass("form-control").val(text);
  $(this).replaceWith(textInput);
  textInput.trigger("focus");
});

$(".list-group").on("blur", "textarea", function () {
  var text = $(this).val().trim();

  var status = $(this).closest(".list-group").attr("id").replace("list-", "");

  var index = $(this).closest(".list-group-item").index();

  tasks[status][index].text = text;
  saveTasks();

  var taskP = $("<p>").addClass("m-1").text(text);
  $(this).replaceWith(taskP);
});
// ==============================================

// ===========CLICK AND CHANGE DATE============
$(".list-group").on("click", "span", function () {
  // get current text
  var date = $(this).text().trim();

  // create new input element
  var dateInput = $("<input>")
    .attr("type", "text")
    .addClass("form-control")
    .val(date);

  $(this).replaceWith(dateInput);

  // enable jquery ui datepicker
  dateInput.datepicker({
    minDate: 1,
    onClose: function () {
      $(this).trigger("change");
    },
  });

  dateInput.trigger("focus");
});

// value of the date was changed
$(".list-group").on("change", "input[type='text']", function () {
  // get current text
  var date = $(this).val().trim();

  // get the parents ul's id attribute
  var status = $(this).closest(".list-group").attr("id").replace("list-", "");

  // get the tasks position in the list of other li elements
  var index = $(this).closest(".list-group-item").index();
  console.log(index);

  // update the task and re-save
  tasks[status][index].date = date;
  saveTasks();

  // recreate span element with bootstrap classes
  var taskSpan = $("<span>")
    .addClass("badge badge-primary badge-pill")
    .text(date);

  // replace input with span element
  $(this).replaceWith(taskSpan);

  auditTask($(taskSpan).closest(".list-group-item"));
});
// ==============================================

// ===========DRAGGABLE AND SORTABLE===============

$(".card .list-group").sortable({
  connectWith: $(".card .list-group"),
  scroll: false,
  tolerance: "pointer",
  helper: "clone",
  activate: function (event) {
    $(this).addClass("dropover");
    $(".bottom-trash").addClass("bottom-trash-drag")
  },
  deactivate: function (event) {
    $(this).removeClass("dropover");
    $(".bottom-trash").removeClass("bottom-trash-drag")
  },
  over: function (event) {
    $(event.target).addClass("dropover-active");
  },
  out: function (event) {
    $(event.target).removeClass("dropover-active");
  },
  update: function (event) {
    // array to store the task data in
    var tempArr = [];

    // loop over current set of children in a sortable list
    $(this)
      .children()
      .each(function () {
        var text = $(this).find("p").text().trim();
        var date = $(this).find("span").text().trim();

        // add task data to the temp array as an object
        tempArr.push({
          text: text,
          date: date,
        });
      });
    var arrName = $(this).attr("id").replace("list-", "");

    // update array on tasks object to save
    tasks[arrName] = tempArr;
    saveTasks();
  },
});

// ==============================================

// ===========DRAGGABLE AND SORTABLE===============

$("#trash").droppable({
  accept: ".card .list-group-item",
  tolerance: "touch",
  drop: function (event, ui) {
    ui.draggable.remove();
  },
  over: function (event, ui) {
    $(".bottom-trash").addClass("bottom-trash-active")
  },
  out: function (event, ui) {
    $(".bottom-trash").removeClass("bottom-trash-active")
  },
});

// ==============================================

// modal was triggered
$("#task-form-modal").on("show.bs.modal", function () {
  // clear values
  $("#modalTaskDescription, #modalDueDate").val("");
});

// modal is fully visible
$("#task-form-modal").on("shown.bs.modal", function () {
  // highlight textarea
  $("#modalTaskDescription").trigger("focus");
});

// modal datepicker
$("#modalDueDate").datepicker({
  minDate: 1,
});

// save button in modal was clicked
$("#task-form-modal .btn-save").click(function () {
  // get form values
  var taskText = $("#modalTaskDescription").val();
  var taskDate = $("#modalDueDate").val();

  if (taskText && taskDate) {
    createTask(taskText, taskDate, "toDo");

    // close modal
    $("#task-form-modal").modal("hide");

    // save in tasks array
    tasks.toDo.push({
      text: taskText,
      date: taskDate,
    });

    saveTasks();
  }
});

// remove all tasks
$("#remove-tasks").on("click", function () {
  for (var key in tasks) {
    tasks[key].length = 0;
    $("#list-" + key).empty();
  }
  saveTasks();
});

// load tasks for the first time
loadTasks();

// CREATE LEADERBOARD!!!
