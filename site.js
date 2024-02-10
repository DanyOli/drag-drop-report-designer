/*
Author: Dany Oli
Date: 2024-01-10
Description: Manual Report Designer - This jQuery file contains code for a manual report designer tool that allows users to design custom reports.
*/

var droppedItems = [];
var currentFocusedInput = "";
var currentFocusedCSS;
var copiedContent;
var isCutContent = false;
var undoHistory = [];
$(document).ready(function (event) {

    resetDefaultAttr()

    //hold input that is clicked in dvDesignerPannel div
    $('#dvDesignerPannel').on('click', 'textarea, .vertical-line, .horizontal-line, .readonly-textarea', function () {

        // Set the z-index property for the previous selected element
        if (currentFocusedInput) {
            currentFocusedInput.css('z-index', 0);
            currentFocusedInput.parent().find(".fa").css('z-index', 0);
            currentFocusedInput.parent().find(".fa").hide();
        }

        //Current selected element
        currentFocusedInput = $(this);
        currentFocusedCSS = currentFocusedInput.attr("style");

        // Set the z-index property for the current selected/clicked element
        currentFocusedInput.css('z-index', 1);
        currentFocusedInput.parent().find(".fa").css('z-index', 1);
        currentFocusedInput.parent().find(".fa").show();

        if (currentFocusedInput) {
            setAttributValues();

            if (currentFocusedInput.hasClass("horizontal-line")) {
                setHorizontalLineHWLimit()
            } else if (currentFocusedInput.hasClass("vertical-line")) {
                setVerticalLineHWLimit()
            }
        }
    });

    // Drag and drop handler for red lines
    $(".dvHorizontalLine1, .dvHorizontalLine2, .dvHorizontalLine3").draggable({
        axis: "y",
        start: function (event, ui) {
            // Store the original position
            ui.helper.data('startPosition', ui.position.top);
        },
        drag: function (event, ui) {
            // Constrain movement to 15px up and down from the original position
            const originalPosition = ui.helper.data('startPosition');
            ui.position.top = Math.min(originalPosition + 30, Math.max(originalPosition - 30, ui.position.top));
        }
    });

    // Drag and drop handler for items
    $(".dragable-items").draggable({
        cursor: "grab",
        helper: "clone",
        revert: "invalid"
    });

    // Droppable handler for #dvDesignerPannel
    $("#dvDesignerPannel").droppable({
        accept: ".dragable-items",
        drop: function (event, ui) {
            var dataId = ui.helper.data("id");

            //var isExist = droppedItems.find(dataId + "_clone");

            if (dataId.split('_')[1] == "clone") {
                //cloned item , no copy only move
            } else {
                //Default Item Append

                var uniqueItemId = generateUniqueId();
                var newDataId = dataId + "_clone";
                droppedItems.push(newDataId);  // push to array

                const clonedItem = ui.helper.clone();

                //Remove fa icon from the p tag if exist... 
                //If you want to add increment no. in textarea(ie. Company Name 1, 2...) after every use then remove this code
                if (clonedItem.find(".fa").length > 0) clonedItem.find(".fa").remove();

                const offset = ui.helper.offset();
                const parentOffset = $(this).offset();
                const left = offset.left - parentOffset.left;
                const top = offset.top - parentOffset.top;
                clonedItem.css({ left: left, top: top });
                clonedItem.removeClass("ui-draggable-dragging");
                clonedItem.attr("data-id", newDataId);// Update cloned data-id
                clonedItem.attr("id", dataId + "_" + uniqueItemId);// Add new id

                clonedItem.draggable({ cursor: "grab" });

                if (dataId == 'tbLabel') {
                    var reqHtml = getRespectiveHTML(dataId, clonedItem, uniqueItemId);
                    $(this).append(reqHtml);

                    $("#" + uniqueItemId).draggable({ cursor: "grab" });

                } else if (dataId == "tbVerticalLine") {

                    //Set min and max limit
                    setVerticalLineHWLimit();

                    //Get Actual html for append
                    var reqHtml = getRespectiveHTML(dataId, clonedItem, uniqueItemId);
                    $(this).append(reqHtml);

                    //Set this html as dragable
                    $("#" + uniqueItemId).draggable({ cursor: "grab" });

                    //Set this html as resizing
                    $("#tbVerticalLine_" + uniqueItemId).resizable({
                        handles: "e, w, n, s", // Only allow resizing from the east side
                        minWidth: 1,
                        maxWidth: 5,
                        minHeight: 10,
                        maxHeight: 595
                    });

                    //Click and focus current line
                    $("#tbVerticalLine_" + uniqueItemId).click().focus();

                } else if (dataId == "tbHorizontalLine") {

                    //Set min and max limit
                    setHorizontalLineHWLimit();

                    var reqHtml = getRespectiveHTML(dataId, clonedItem, uniqueItemId);
                    $(this).append(reqHtml);

                    $("#" + uniqueItemId).draggable({ cursor: "grab" });

                    $("#tbHorizontalLine_" + uniqueItemId).resizable({
                        handles: "e, w, n, s",
                        minWidth: 10,
                        maxWidth: 792,
                        minHeight: 1,
                        maxHeight: 5
                    });

                    //Click and focus current line
                    $("#tbHorizontalLine_" + uniqueItemId).click().focus();

                } else if (true) {
                    //DataSet Item Append
                    var reqHtml = getRespectiveHTML(dataId, clonedItem, uniqueItemId);

                    //For details
                    if (clonedItem.hasClass("details")) {
                        // Check if #dvDetails exists
                        var detailsContainer = $("#dvDesignerPannel").find("#dvDetails");

                        // If #dvDetails doesn't exist, create it
                        if (!detailsContainer.length) {
                            detailsContainer = $("<div id='dvDetails' class='dv-details'><div id='dw_0' class='details-wrapper'></div></div>");
                        } else if (detailsContainer.length > 1) {
                            alert("Someting is going wrong");
                        }
                        // Append reqHtml to the .details-wrapper inside #dvDetails
                        detailsContainer.find('.details-wrapper').append(reqHtml);

                        // Append the #dvDetails div to the current element
                        $(this).append(detailsContainer);

                        showDetailsToolBox();
                    } else if (clonedItem.hasClass("terms")) {
                        var termsContainer = $("#dvDesignerPannel").find("#dvTerms");
                        if (!termsContainer.length) {
                            termsContainer = $("<div id='dvTerms' class='dv-terms'></div>");
                        } else if (termsContainer.length > 1) {
                            alert("Someting is going wrong");
                        }
                        termsContainer.append(reqHtml)
                        $(this).append(termsContainer);

                    } else if (true) {
                        $(this).append(reqHtml);
                    }

                    $("#" + uniqueItemId).draggable({ cursor: "grab" });
                    markUsedDataSet(dataId); //Make count for used data set item
                }
            }
        }
    });

    // #Text Formating Section

    // Bold Button Click Event
    $("#font-bold-maker, #font-italic-maker, #font-underline-maker").on("mousedown", function (e) {
        // Prevent the default behavior of the left mouse click
        if (e.which === 1) {
            e.preventDefault();
        }
    });

    // Bold Text 
    $("#font-bold-maker").on("click", function () {
        // Get the currently focused input field
        var focusedInput = currentFocusedInput;
        if (focusedInput && focusedInput.length > 0) {
            if (focusedInput.is('textarea')) {
                var currentFontWeight = focusedInput.css("font-weight");

                var newFontWeight = (currentFontWeight === "400") ? 700 : 400;
                focusedInput.css("font-weight", newFontWeight);
            }
        }
    });

    // Italic Text 
    $("#font-italic-maker").on("click", function () {
        var focusedInput = currentFocusedInput;
        if (focusedInput && focusedInput.length > 0) {
            if (focusedInput.is('textarea')) {
                var currentFontStyle = focusedInput.css("font-style");
                var newFontStyle = (currentFontStyle === "italic") ? "normal" : "italic";
                focusedInput.css("font-style", newFontStyle);
            }
        }
    });

    //Underline Text
    $("#font-underline-maker").on("click", function () {
        var focusedInput = currentFocusedInput;
        if (focusedInput && focusedInput.length > 0) {
            if (focusedInput.is('textarea')) {
                var currentFontUnderline = focusedInput.css("text-decoration");
                if (currentFontUnderline === "rgb(85, 85, 85)") {
                    focusedInput.css("text-decoration", "underline");
                } else {
                    focusedInput.css("text-decoration", "none");
                }
            }
        }
    });

    //Text Size
    $("#font-size-maker").on("change", function () {
        var focusedInput = currentFocusedInput;
        if (focusedInput && focusedInput.length > 0) {
            if (focusedInput.is('textarea')) {
                var fontSize = $("#font-size-maker").val();
                focusedInput.css("font-size", fontSize + "px");
                //focusedInput.focus();
            }
        }
    });

    //Text align Left
    $("#font-left-maker, #font-right-maker, #font-center-maker, #font-justify-maker").on("click", function (e) {
        var focusedInput = currentFocusedInput;
        if (focusedInput && focusedInput.length > 0) {
            if (focusedInput.is('textarea')) {
                if ($(e.target).closest("#font-left-maker").length > 0) { // Check if the click occurred in #font-left-maker
                    focusedInput.css("text-align", "left");
                } else if ($(e.target).closest("#font-right-maker").length > 0) { // Check if the click occurred in #font-right-maker
                    focusedInput.css("text-align", "right");
                } else if ($(e.target).closest("#font-center-maker").length > 0) { // Check if the click occurred in #font-center-maker
                    focusedInput.css("text-align", "center");
                } else if ($(e.target).closest("#font-justify-maker").length > 0) { // Check if the click occurred in #font-justify-maker
                    focusedInput.css("text-align", "justify");
                }
                focusedInput.focus();
            }
        }
    });

    //Line Formatter
    // Move textareas only uisng arrow key 
    $('#dvDesignerPannel').on("keydown", function (e) {

        if (e.ctrlKey == false && (e.key == "ArrowRight" || e.key == "ArrowLeft" || e.key == "ArrowUp" || e.key == "ArrowDown")) {
            moveDataSet(e);
        } else if (e.ctrlKey == true && (e.key == "ArrowRight" || e.key == "ArrowLeft" || e.key == "ArrowUp" || e.key == "ArrowDown")) {
            adjustTextareaHeightWidth(e);
        }// else {
        //    e.preventDefault();
        //    e.stopPropagation();
        //    return false;
        //}
    });

    //This is for moving line only
    $(document).on("keydown", function (e) {
        //Doesnot allow to delete text that have class readonly-textarea
        if (currentFocusedInput != "" && currentFocusedInput.hasClass("readonly-textarea")) return false;

        if (e.ctrlKey == false && (e.key == "ArrowRight" || e.key == "ArrowLeft" || e.key == "ArrowUp" || e.key == "ArrowDown")) {
            moveDataSet(e);
        }
    });

    ////Prevent original value & Move only System DataSet right, left, up and down by arrow key
    //$('#dvDesignerPannel').on('keydown oncut onpaste input', '.readonly-textarea', function (e) {
    //    if (!currentFocusedInput && currentFocusedInput.length == 0) return false;
    //    //Move  right, left, up and down
    //    if ((e.key == "ArrowRight" || e.key == "ArrowLeft" || e.key == "ArrowUp" || e.key == "ArrowDown")) {
    //        moveDataSet(e);
    //    }
    //    else if (e.ctrlKey == true && (e.key == "ArrowRight" || e.key == "ArrowLeft" || e.key == "ArrowUp" || e.key == "ArrowDown")) {
    //        adjustTextareaHeightWidth(e);
    //    }
    //    else if (true) {
    //        //Prevent original value
    //        e.preventDefault();
    //        e.stopPropagation();
    //        return false;
    //    }
    //});

    function moveDataSet(e) {
        var focusedLine = currentFocusedInput;
        if (focusedLine && focusedLine.length > 0) {

            var vhLine = focusedLine.parent();
            var style = vhLine.attr("style");

            // Extract values using regular expressions
            var leftValue = extractStyleValue(style, 'left');
            var topValue = extractStyleValue(style, 'top');

            // Convert values to numbers
            leftValue = parseFloat(leftValue) || 0;
            topValue = parseFloat(topValue) || 0;

            if (e.key == "ArrowRight") {
                leftValue += 1;
                vhLine.css("left", leftValue + "px"); // increase
            } else if (e.key == "ArrowLeft") {
                leftValue -= 1;
                vhLine.css("left", leftValue + "px"); // decrease
            } else if (e.key == "ArrowUp") {
                topValue -= 1;
                vhLine.css("top", topValue + "px");  // decrease
            } else if (e.key == "ArrowDown") {
                topValue += 1;
                vhLine.css("top", topValue + "px");  // increase
                e.preventDefault(); // prevent default arrow key behavior
            }
            focusedLine.focus();
        }
    }

    function adjustTextareaHeightWidth(e) {
        if (!currentFocusedInput || currentFocusedInput.length == 0) return false;

        var textarea = currentFocusedInput;
        var style = textarea.attr("style");

        // Extract values using regular expressions
        var widthValue = extractStyleValue(style, 'width');
        var heightValue = extractStyleValue(style, 'height');

        // Convert values to numbers
        widthValue = parseFloat(widthValue) || 0;
        heightValue = parseFloat(heightValue) || 0;

        if (e.key == "ArrowRight") {
            widthValue += 1;
            textarea.css("width", widthValue + "px"); // increase
        } else if (e.key == "ArrowLeft") {
            widthValue -= 1;
            textarea.css("width", widthValue + "px"); // decrease
        } else if (e.key == "ArrowUp") {
            heightValue -= 1;
            textarea.css("height", heightValue + "px");  // decrease
        } else if (e.key == "ArrowDown") {
            heightValue += 1;
            textarea.css("height", heightValue + "px");  // increase
            e.preventDefault(); // prevent default arrow key behavior
        }
        textarea.focus();

    }

    $("#line-color-maker").on("change", function (e) {
        var focusedLine = currentFocusedInput;
        if (focusedLine && focusedLine.length > 0) {

            var colorCode = $(this).val();
            var lineType = focusedLine.hasClass("vertical-line");
            if (lineType) {
                focusedLine.css("background-color", colorCode);
            } else {

                let borderTop = focusedLine.css("border-top");
                let borderParts = borderTop.split(/\s(?![^(]*\))/);

                let borderHeight = borderParts[0];
                let borderType = borderParts[1];
                let borderColor = convertRBGToHex(borderParts[2]);

                let css = borderHeight + " " + borderType + " " + colorCode;
                focusedLine.css("border-top", css);
            }
            focusedLine.focus();
        }
    });

    $("#line-width-maker").on("change", function (e) {
        if (!currentFocusedInput && currentFocusedInput.length == 0) return false;

        var focusedLine = currentFocusedInput;
        var lineType = focusedLine.hasClass("vertical-line");
        var lineWidth = $("#line-width-maker").val();

        if (lineType && lineWidth >= 1 && lineWidth <= 5) {
            setVerticalLineHWLimit();
            focusedLine.css("width", lineWidth);
        }
        else if (!lineType && lineWidth >= 10 && lineWidth <= 792) {
            setHorizontalLineHWLimit();
            focusedLine.css("width", lineWidth);
        }

        focusedLine.focus();
    });

    $("#line-height-maker").on("change", function (e) {
        if (!currentFocusedInput && currentFocusedInput.length == 0) return false;

        var focusedLine = currentFocusedInput;
        var lineType = focusedLine.hasClass("vertical-line");
        var lineHeight = $("#line-height-maker").val();

        if (lineType && lineHeight >= 10 && lineHeight <= 595) {
            setVerticalLineHWLimit();
            focusedLine.css("height", lineHeight);
        }
        else if (!lineType && lineHeight >= 1 && lineHeight <= 5) {
            setHorizontalLineHWLimit();

            let borderTop = focusedLine.css("border-top");
            let borderParts = borderTop.split(/\s(?![^(]*\))/);

            let borderHeight = removePx(borderParts[0]);
            let borderType = borderParts[1];
            let borderColor = borderParts[2];

            focusedLine.css("border-top", lineHeight + "px " + borderType + " " + borderColor);
        }
        focusedLine.focus();
    });

    //todo  for with of line and solid dash 
    $("#line-solid-maker, #line-dashed-maker, #line-dotted-maker").on("click", function (e) {
        var focusedLine = currentFocusedInput;
        if (focusedLine && focusedLine.length > 0 && focusedLine.hasClass("horizontal-line")) {

            let borderTop = focusedLine.css("border-top");
            let borderParts = borderTop.split(/\s(?![^(]*\))/);

            let borderHeight = removePx(borderParts[0]);
            let borderColor = borderParts[2];

            if ($(e.target).closest("#line-solid-maker").length > 0) {
                focusedLine.css("border-top", borderHeight + "px solid " + borderColor);

            } else if ($(e.target).closest("#line-dashed-maker").length > 0) {
                focusedLine.css("border-top", borderHeight + "px dashed " + borderColor);

            } else if ($(e.target).closest("#line-dotted-maker").length > 0) {
                focusedLine.css("border-top", borderHeight + "px dotted " + borderColor);
            }
            focusedLine.focus();
        }
    });

});

function getRespectiveHTML(itemId, clonedItem, uniqueItemId) {
    var html = '';

    // Extract properties from the cloned <p> element
    var dataId = $(clonedItem).attr('data-id');
    var classes = $(clonedItem).attr('class');
    var style = $(clonedItem).attr('style');
    var id = $(clonedItem).attr('id');
    var text = $(clonedItem).text().trim();

    switch (itemId) {
        case "tbLabel":
            html += '<div id="' + uniqueItemId + '" class="item-wrapper draggable-item" style="display:flex;' + style + '">';
            html += '<textarea id="' + id + '" class="form-control textarea draggable-items ' + classes + ' " style="height: 24px;width:175px;max-width:740px;" data-id="' + dataId + '"  data-position="' + style + '" placeholder="Label"> </textarea>';
            html += '<i class="input-close-icon fa fa-times-circle" aria-hidden="true" onclick="removeItem(this)"></i>';
            html += '<i class="input-drag-icon fa fa-arrows" aria-hidden="true"></i>';
            html += '</div>';
            break;
        case "tbVerticalLine":
            html += '<div id="' + uniqueItemId + '" class="item-wrapper draggable-item line" style="display:flex;' + style + '">';
            html += '<div id="' + id + '" class="vertical-line draggable-items ' + classes + ' " data-id="' + dataId + '" data-position="' + style + '"></div>';
            html += '<i class="vline-close-icon fa fa-times-circle" aria-hidden="true" onclick="removeLine(this)"></i>';
            html += '<i class="vline-drag-icon fa fa-arrows" aria-hidden="true"></i>';
            html += '</div>';
            break
        case "tbHorizontalLine":
            html += '<div id="' + uniqueItemId + '" class="item-wrapper draggable-item line" style="display:flex;' + style + '">';
            html += '<div id="' + id + '" class="horizontal-line draggable-items ' + classes + ' " data-id="' + dataId + '" data-position="' + style + '"></div>';
            html += '<i class="hline-close-icon fa fa-times-circle" aria-hidden="true" onclick="removeLine(this)"></i>';
            html += '<i class="hline-drag-icon fa fa-arrows" aria-hidden="true"></i>';
            html += '</div>';
            break
        default://For Data Set
            html += '<div id="' + uniqueItemId + '" class="item-wrapper draggable-item" style="display:flex;' + style + '">';
            html += '<textarea id="' + id + '" class="form-control readonly-textarea draggable-items sysDataSet_clone ' + classes + '" style="height: 24px; width: 175px; max-width: 740px;" data-id="' + dataId + '" data-position="' + style + '">' + text + '</textarea>';
            html += '<i class="input-close-icon fa fa-times-circle" aria-hidden="true" onclick="removeItem(this)"></i>';
            html += '<i class="input-drag-icon fa fa-arrows" aria-hidden="true"></i>';
            html += '</div>';
            break
    }
    return html;
}

//Function to remove the item when the close icon is clicked
function removeLine(element) {
    $(element).parent().remove();
}
function removeItem(element) {

    // Remove the checked icon from the dataset
    var textareaId = $(element).parent().find("textarea").attr("id"); // Get the ID of the textarea
    var originalId = textareaId.split('_')[0];

    var counterElement = $("#dvLeftPannel #" + originalId + " .used-icon-counter");
    if (counterElement.length > 0) {
        var counter = parseInt(counterElement.text()); // Get the current counter value
        counter--;
        counterElement.text(counter); // Update the counter text
        // If counter becomes 0, remove the counter element
        if (counter === 0) {
            counterElement.parent().remove();
        }
    }

    //Remve div #dvDetails if it has only one child
    var detailsHtml = $("#dvDetails").html();
    var $detailsWrapper = $(detailsHtml); // Convert to jQuery object
    if ($detailsWrapper.children().length == 1) {
        $("#dvDetails").remove();
    }

    // Remove the dropped item
    $(element).parent().remove();
}

function generateUniqueId() {
    var timestamp = new Date().getTime();
    var randomNumber = Math.floor(100000 + Math.random() * 900000);
    var uniqueId = timestamp.toString() + randomNumber.toString();
    return uniqueId;
}

function extractStyleValue(styleString, property) {
    if (!styleString || !property) {
        return null;
    }
    var regex = new RegExp(property + ":\s*([^;]+)");
    var match = styleString.match(regex);
    if (match) {
        var valueWithPx = match[1].trim();
        return valueWithPx.replace("px", "");
    }
}

function setAttributValues() {
    if (currentFocusedInput) {
        let style = currentFocusedInput.attr("style");

        //Set Text values
        if (currentFocusedInput.hasClass("textarea")) {
            let fontWeight = currentFocusedInput.css("font-weight");
            let fontStyle = currentFocusedInput.css("font-style");
            let fontUnderline = currentFocusedInput.css("text-decoration");

            let width = removePx(currentFocusedInput.css("width"));
            let height = removePx(currentFocusedInput.css("height"));
        }

        //Set Vertical Line Values
        if (currentFocusedInput.hasClass("vertical-line")) {
            let bgColor = convertRBGToHex(currentFocusedInput.css("background-color"));
            let width = removePx(currentFocusedInput.css("width"));
            let height = removePx(currentFocusedInput.css("height"));

            //Set default value
            $("#line-color-maker").val(bgColor);
            $("#line-width-maker").val(width);
            $("#line-height-maker").val(height);
        }
        //Set Horizontal Line Values
        if (currentFocusedInput.hasClass("horizontal-line")) {
            let cssValue = currentFocusedInput.css("border-top");
            //to get rgb(92, 57, 234) from "1px solid rgb(92, 57, 234)"
            let rgbColor = cssValue.replace(/\d+px solid /, "");
            let borderColor = convertRBGToHex(rgbColor);
            let width = removePx(currentFocusedInput.css("width"));
            let height = removePx(currentFocusedInput.css("height"));

            //Set default value
            $("#line-color-maker").val(borderColor == "#a49999" ? "#000" : borderColor);
            $("#line-width-maker").val(width);
            $("#line-height-maker").val(height);
        }

        //Hide show for line formating
        if (currentFocusedInput.hasClass("horizontal-line") || currentFocusedInput.hasClass("vertical-line")) {
            $("#line-formatting").slideDown("slow");;
        } else {
            $("#line-formatting").slideUp("slow");
        }

        //Set DataSet Values
        if (currentFocusedInput.hasClass("readonly-textarea")) {
            let fontSize = removePx(currentFocusedInput.css("font-size"));

            //Set default value
            if (fontSize > 5) {
                $("#font-size-maker").val(fontSize);
            }
        }

        //Show details row height div
        if (currentFocusedInput.hasClass("details")) {
            $("#detailToolbox").slideDown("slow");
        } else {
            $("#detailToolbox").slideUp("show");
        }
    }
}

// Convert to require Tools
$("#btnLoadReport").on("click", function () {
    var isDesigning = $("#dvDesignerPannel").find("i.fa");
    if (isDesigning && isDesigning.length > 0) {
        if (!confirm("Designing is in process. Are you sure to remove current design ?")) {
            return false;
        }
    }

    // getRDesignDataSet();
});
function getRDesignDataSet() {
    var reportType = $("#Report_Type").val();
    var reportName = $("#txtReportName").val();

    if (!reportType || !reportName) {
        alert("Report Type and Report Name is required field !!");
        return false;
    }
    $('.ajax-loader').css("visibility", "visible");
    $.ajax({
        type: "Get",
        url: "/BackOffice/ReportDesigner/GetReportDesigner",
        data: { reportType, reportName },
        success: function (result) {

            //hide loader
            if (result != null && result.dataSetNameList) {
                var jsonModel = JSON.parse(result.dataSetNameList);

                $("#sysDataSetMastList").empty();
                $("#sysDataSetDetailsList").empty();
                var mastDataSetHtml = "";
                var detailsDataSetHtml = "";
                var termsDataSetHtml = "";

                for (var key in jsonModel) {
                    if (jsonModel.hasOwnProperty(key)) {
                        if (key === "Details") {
                            for (var detailKey in jsonModel[key]) {
                                if (jsonModel[key].hasOwnProperty(detailKey)) {
                                    //for Details
                                    detailsDataSetHtml += '<p id="' + detailKey + '" data-id="' + detailKey + '" class="dragable-items details" draggable="true"> ' + jsonModel[key][detailKey] + ' </p>';
                                }
                            }
                        } else  {
                            //for Mast
                            mastDataSetHtml += '<p id="' + key + '" data-id="' + key + '" class="dragable-items mast" draggable="true"> ' + jsonModel[key] + ' </p>';
                        }
                    }
                }

                $("#sysDataSetMastList").append(mastDataSetHtml);
                $("#sysDataSetDetailsList").append(detailsDataSetHtml);

                //Append existance report
                $("#dvDesignerPannel").empty();
                if (result.htmlContent) {
                    $("#dvDesignerPannel").append(result.htmlContent);
                    $("#dvDesignerPannel .dragable-item").draggable({ cursor: "grab" });//not working
                }

                //Enable to drag.
                $("#sysDataSetMastList .dragable-items, #sysDataSetDetailsList .dragable-items, #sysDataSetTermsList .dragable-items").draggable({
                    cursor: "grab",
                    helper: "clone",
                    revert: "invalid"
                });
            }
        }, error: function (xhr, status, error) {
            //hide loader
            alert('Error Status: ' + status + '\nError Message: ' + error);
        }
    });

}

function removePx(value) {
    if (value && value.includes("px")) {
        return value.replace("px", "");
    }
    return value;
}
function convertRBGToHex(rbgColor) {

    // Extract RGB components using regex
    var rgbComponents = rbgColor.match(/\d+/g);

    if (rgbComponents && rgbComponents.length === 3) {
        // Convert RGB components to hexadecimal format
        var hexColor = "#" + rgbComponents.map(function (component) {
            return ('0' + parseInt(component).toString(16)).slice(-2);
        }).join('');
        return hexColor;
    }
    return rbgColor;
}
function setVerticalLineHWLimit() {
    $("#line-width-maker").prop({ 'max': 5, 'min': 1 });
    $("#line-height-maker").prop({ 'max': 595, 'min': 10 });
}
function setHorizontalLineHWLimit() {
    $("#line-width-maker").prop({ 'max': 792, 'min': 10 });
    $("#line-height-maker").prop({ 'max': 5, 'min': 1 });
}
function resetDefaultAttr() {
    $('#font-size-maker').val(13);
    $("#Report_Type").val('SalesBill');
    $('#txt-search-dataset').val('');
    $('#txtReportName').val('s1');
}

//Enter key Function
$("#font-size-maker").keypress(function (e) {
    if (e.which === 13 || e.which === 10) {
        e.preventDefault();
        $('#font-size-maker').trigger("change");
    }
});

$("#line-width-maker").keypress(function (e) {
    if (e.which === 13 || e.which === 10) {
        e.preventDefault();
        $('#line-width-maker').trigger("change");
    }
});

$("#line-height-maker").keypress(function (e) {
    if (e.which === 13 || e.which === 10) {
        e.preventDefault();
        $('#line-height-maker').trigger("change");
    }
});


//Search DataSet
$("#txt-search-dataset").keyup(function (e) {
    searchDataset();
});

$("#clear-search").click(function () {
    $('#txt-search-dataset').val('');
    searchDataset()
    $("#txt-search-dataset").focus();
});

function searchDataset() {
    var listItems = "";

    var userInput = $('#txt-search-dataset').val().toLowerCase();

    var clearSearchIcon = $('#clear-search');

    if (userInput.trim() !== '') {
        clearSearchIcon.removeClass('d-none');
    } else {
        clearSearchIcon.addClass('d-none');
    }

    if (!$('#sysDataSetMastList').is(":hidden")) {
        listItems = $('#sysDataSetMastList p');
    } else if (!$('#sysDataSetDetailsList').is(":hidden")) {
        listItems = $('#sysDataSetDetailsList p');
    } else {
        listItems = $('#sysDataSetTermsList p');
    }

    listItems.hide();

    // Show only the matching list items
    listItems.filter(function () {
        return $(this).text().toLowerCase().includes(userInput);
    }).show();
}

$("#lbl-view-mastDataset").click(function () {
    $("#sysDataSetMastList").show();
    $("#sysDataSetDetailsList").hide();
    $("#sysDataSetTermsList").hide();
    searchDataset();
});
$("#lbl-view-detailsDataset").click(function () {
    $("#sysDataSetMastList").hide();
    $("#sysDataSetDetailsList").show();
    $("#sysDataSetTermsList").hide();
    searchDataset();
});
$("#lbl-view-termsDataset").click(function () {
    $("#sysDataSetMastList").hide();
    $("#sysDataSetDetailsList").hide();
    $("#sysDataSetTermsList").show();
    searchDataset();
});

// Define a function to mark a dataset as used
function markUsedDataSet(dataId) {
    // Check if the icon already exists
    var iconExist = $("#dvLeftPannel #" + dataId + " .fa-check-circle");

    // If the icon doesn't exist, create it
    if (iconExist.length === 0) {
        createIcon(dataId);
    } else {
        // If the icon exists, update the counter
        updateCounter(dataId);
    }
}

// Function to create the icon
function createIcon(dataId) {
    var counter = 1; // Initialize the counter

    // Create the icon element with the counter
    var icon = $('<i>', {
        class: 'fa fa-check-circle text-success pull-right used-icon',
        html: '<span class="used-icon-counter">' + counter + '</span>'
    });

    // Append the icon to the dataset element
    $('#' + dataId).append(icon);
}

//Browser Full Screen on/off
$("#fullScreen").click(function () {
    var elem = document.documentElement; // Fullscreen the entire document
    if (!document.fullscreenElement) {
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.mozRequestFullScreen) { /* Firefox */
            elem.mozRequestFullScreen();
        } else if (elem.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) { /* IE/Edge */
            elem.msRequestFullscreen();
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) { /* Firefox */
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) { /* Chrome, Safari and Opera */
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) { /* IE/Edge */
            document.msExitFullscreen();
        }
    }
});

// Function to update the counter
function updateCounter(dataId) {
    // Increment the counter
    var counter = parseInt($("#dvLeftPannel #" + dataId + " .used-icon-counter").text()) + 1;

    // Update the counter text
    $("#dvLeftPannel #" + dataId + " .used-icon-counter").text(counter);
}


// Priview and Save  
$("#btnPreviewDesign").click(function () {
    $('#previewModalBody').empty();
    var designHTML = $('#dvDesignerPannel').clone();

    // Remove the content with the specified Id or class from the cloned element
    designHTML.find('#dvGraphLine').remove();
    designHTML.find('.fa').remove();

    var resultHtml = designHTML.html();

    $("#previewModalBody").append(resultHtml);

    $("#previewModalBody textarea").each(function () {
        var id = $(this).attr("id");
        var css = $(this).attr("style");
        var textareaClass = $($(this).attr("class"));
        var textareaValue = $("#dvDesignerPannel #" + id).val(); // Getting value from design pannel

        if (!css.includes("font-weight")) {
            css += "font-weight: normal;";
        }

        //if (css.includes("width")) {
        //    css = css.replace(/width[^;]+;|height[^;]+;|max-width[^;]+;/g, "");
        //}

        // Break line if it \n exist;
        if (textareaValue.includes('\n')) {
            textareaValue = textareaValue.replace(/\n/g, '<br/>');
        }

        textareaClass.removeClass("form-control");
        textareaClass.removeClass("sysDataSet_clone");

        var detailClassName = '';
        if ($(this).hasClass("details")) {
            detailClassName = "details";
            //css += "width: 100%;";
        }

        var label = $('<label id=' + id + ' class=' + detailClassName + '>').html(textareaValue).attr("style", css);
        $("#previewModalBody #" + id).replaceWith(label);
    });

    $("#previewModal").modal('show');
    // Call to get actual data from DB
    //getFinalReportData("");

});

function saveDesign(calledBy) {
    var designHTML = $('#dvDesignerPannel').clone();
    var reportType = $('#Report_Type').val();
    var reportName = $('#txtReportName').val();
    if (!designHTML || !reportType || !reportName) return false;

    designHTML.find('#dvGraphLine').remove();

    $("#dvDesignerPannel textarea").each(function () {
        var id = $(this).attr("id");
        var textareaValue = $(this).val();
        // Break line if it \n exist;
        if (textareaValue.includes('\n')) {
            textareaValue = textareaValue.replace(/\n/g, '<br/>');
        }
        designHTML.find("#" + id).html(textareaValue);
    });

    htmlContent = designHTML.html();

    $('.ajax-loader').css("visibility", "visible");
    $.ajax({
        type: "Post",
        url: "/api/ReportDesigner/SaveReportDesigner",
        data: { reportType, htmlContent, reportName },
        success: function (result) {
            //hide loader
            if (result && result.resCode == 100) {
                if (calledBy == "btnDraftSave") {
                    showToastMsg("Saved as draft !!");
                } else {
                    alert("Successfully Saved !!");
                }
            } else {
                alert(result.resMsg);
            }
        }, error: function (xhr, status, error) {
            //hide loader
            alert('Error Status: ' + status + '\nError Message: ' + error);
        }
    });
}
$("#btnSaveDesign").click(function () {
    var calledBy = $(this).attr('id');
    saveDesign(calledBy);
});


//Custom Right click Options
$(document).ready(function () {
    // Right-click event listener for #dvDesignerPannel
    $("#dvDesignerPannel").on("contextmenu", function (event) {
        // Prevent the default right-click menu from appearing
        event.preventDefault();

        // Show the custom context menu at the mouse position
        $("#customContextMenu").css({
            display: "block",
            left: event.pageX - 55,
            top: event.pageY - 80
        });
    });

    // Click event listener for the custom context menu options
    $("#customContextMenu li").click(function (event) {
        // Perform action based on clicked option
        var optionId = $(this).attr("id");
        switch (optionId) {
            case "Copy":
                copyHtmlContent();
                break;
            case "Paste":
                pasteHtmlContent(event);
                break;
            case "Cut":
                cutHtmlContent();
                break;
            case "Undo":
                undoHtmlContent();
                break;
        }

        // Hide the custom context menu
        $("#customContextMenu").css("display", "none");
    });

    // Hide the custom context menu when clicking outside of it
    $(document).click(function () {
        $("#customContextMenu").css("display", "none");
    });
});

function showToastMsg(msg) {
    if (!msg) msg = "Copied !"

    $("#spnToastMessage").empty();
    $("#spnToastMessage").append(msg).fadeIn();
    setTimeout(function () {
        $("#spnToastMessage").fadeOut();
    }, 2000);
}

// Copy selected content
function copyHtmlContent() {
    if (!currentFocusedInput) return false;
    copiedContent = currentFocusedInput.parent().prop('outerHTML');//holding copied content

    showToastMsg("Copied!");

    undoHistory.push(copiedContent);
}
function pasteHtmlContent(event) {
    event.preventDefault();

    let copiedElement = $(copiedContent);
    if (copiedElement && copiedElement.length > 0) {

        let id = copiedElement.attr("id");
        let css = copiedElement.attr("style");

        // Extract values using regular expressions
        let top = parseFloat(extractStyleValue(css, "top"));
        let left = parseFloat(extractStyleValue(css, "left"));

        //move down copied/cut element/content
        top += 50;
        left += 50;

        //For Cut element/Content
        if (isCutContent === true) {
            $('#dvDesignerPannel').append(copiedElement);

            $('#' + id).css("top", top);
            $('#' + id).css("left", left);

            $("#" + id).draggable({ cursor: "grab" });
            $('#' + id).click().focus();
            isCutContent = false;
            return false;
        }

        //Update new id for copied element
        var newId = generateUniqueId();
        copiedElement.attr('id', newId);

        // Update child element Id
        var childId = '';
        copiedElement.find('*').each(function () {
            childId = $(this).attr('id');
            if (childId && childId.includes(id)) {
                let idType = childId.split("_")[0];
                $(this).attr('id', idType + "_" + newId);
                return;
            }
        });

        $('#dvDesignerPannel').append(copiedElement);

        //Paste away from original element

        $('#' + newId).css("top", top);
        $('#' + newId).css("left", left);

        $("#" + newId).draggable({ cursor: "grab" });
        $('#' + childId).click().focus();

        undoHistory.push(copiedElement);
    }
}
function cutHtmlContent() {
    //holding copied content
    if (currentFocusedInput) {
        copiedContent = currentFocusedInput.parent().prop('outerHTML');
        currentFocusedInput.parent().remove();
        isCutContent = true;
        undoHistory.push(copiedContent);
    }
}

// Function to save the current state
function saveState() {
    var currentState = getState();
    undoHistory.push(currentState);
}
// Function to undo the last action
function undoHtmlContent() {
    if (undoHistory.length > 1) {
        undoHistory.pop();
        var previousState = undoHistory[undoHistory.length - 1];
        applyState(previousState);
    }
}
function undoHtmlContent() {
    if (undoHistory.length > 1) {
        // Remove the last state from the undoHistory 
        undoHistory.pop();
        // Get the previous state
        var previousState = undoHistory[undoHistory.length - 1];
        // Apply the previous state to revert the action
        applyState(previousState); // Replace applyState() with the function to apply the state
    }
}
function applyState(state) {
    $('#dvDesignerPannel').append(state);
}
// Function to handle copy event (ctrl+c)
$("#dvDesignerPannel").on("keydown", function (event) {
    if (event.ctrlKey && event.key === 'c') {
        copyHtmlContent();
    }

    // Function to handle paste event (ctrl+v)
    if (event.ctrlKey && event.key === 'v') {
        pasteHtmlContent(event);
    }

    // Function to handle paste event (ctrl+x)
    if (event.ctrlKey && event.key === 'x') {
        cutHtmlContent(event);
    }

    // Function to handle paste event (ctrl+z)  
    if (event.ctrlKey && event.key === 'z') {
        // undoHtmlContent(event);
        alert("Features not available !!");
    }

    if (event.ctrlKey && event.key === 'c') {
        copyHtmlContent();
    }
});

$("#txtReportName").keypress(function (e) {
    if (e.which === 13 || e.which === 10) {
        e.preventDefault();
        $('#btnLoadReport').trigger("click");
    }
});

function getFinalReportData(billNo) {
    billNo = '01488';
    var reportType = $("#Report_Type").val();
    var reportName = $("#txtReportName").val();
    if (!reportType && !reportName) return false;

    $.ajax({
        url: "/api/ReportDesigner/GetDataSet",
        dataType: "json",
        data: { billNo, reportType, reportName },
        async: false,
        success: function (result) {
            //hide loader
            if (result == null) {
                alert("Data Not Found !");
                return false;
            }
            setDataToDataSet(result);
        },
        error: function () {
            //hide loader
            alert('Error on deleting data, Contact for support.');
        }
    });
}

function setDataToDataSet(result) {
    var designHtml = $($("#previewModalBody").html());
    var decimalToFixed = parseInt($("#txtDecimalNo").val() || "0");

    //For Mast
    designHtml.find('[id]:not(#dvDetails [id])').each(function () {

        var itemId = $(this).attr('id');
        if (!itemId) return;

        //break loop if the item is terms
        if ($(this).hasClass("terms")) return;

        var idType = itemId.split('_')[0];
        var uniqueId = itemId.split('_')[1];

        var companyModel = result.companyModel;

        switch (idType) {
            //Company Model
            case "Logo":
                var logoPath = "";
                $('#previewModal #Logo_' + uniqueId).html(logoPath);
                break;
            case "CompanyName":
                $('#previewModal #CompanyName_' + uniqueId).html(companyModel.companyName);
                break;
            case "CompanyAddress":
                $('#previewModal #CompanyAddress_' + uniqueId).html(companyModel.address);
                break;
            case "CompanyCity":
                $('#previewModal #CompanyCity_' + uniqueId).html(companyModel.city);
                break;
            case "CompanyPAN":
                $('#previewModal #CompanyPAN_' + uniqueId).html(companyModel.panNo);
                break;
            case "CompanyContact":
                $('#previewModal #CompanyContact_' + uniqueId).html(companyModel.phoneNo);
                break;
            case "CompanyMobile":
                $('#previewModal #CompanyMobile_' + uniqueId).html(companyModel.mobileNo);
                break;
            case "CompanyState":
                $('#previewModal #CompanyState_' + uniqueId).html(companyModel.state);
                break;
            case "CompanyCountry":
                $('#previewModal #CompanyCountry_' + uniqueId).html(companyModel.country);
                break;
            case "CompanyEmail":
                $('#previewModal #CompanyEmail_' + uniqueId).html(companyModel.email);
                break;
            case "CompanyAccPeriodNep":
                $('#previewModal #CompanyAccPeriodNep_' + uniqueId).html(companyModel.financialYearStarMiti + " - " + companyModel.FinancialYearEndMiti);
                break;
            case "CompanyAccPeriodEng":
                $('#previewModal #CompanyAccPeriodEng_' + uniqueId).html(companyModel.financialYearStartDate + " - " + companyModel.financialYearEndDate);
                break;

            //Customer
            case "CustomerName":
                $('#previewModal #CustomerName_' + uniqueId).html(result.sB_Customer);
                break;
            case "CustomerAddress":
                $('#previewModal #CustomerAddress_' + uniqueId).html(result.sB_Customer_Address);
                break;
            case "CustomerPAN":
                $('#previewModal #CustomerPAN_' + uniqueId).html(result.sB_Customer_PanNo);
                break;
            case "CustomerContact":
                $('#previewModal #CustomerContact_' + uniqueId).html(result.sB_Customer_Contact_Person);
                break;
            case "CustomerMobile":
                $('#previewModal #CustomerMobile_' + uniqueId).html(result.sB_Customer_Phone);
                break;
            case "CustomerState":
                $('#previewModal #CustomerState_' + uniqueId).html(result.sB_Customer_State);
                break;
            case "CustomerCountry":
                $('#previewModal #CustomerCountry_' + uniqueId).html(result.sB_Customer_Country);
                break;
            case "CustomerCurrBalance":
                $('#previewModal #CustomerCurrBalance_' + uniqueId).html(result.sB_Customer_Current_Balance);
                break;
            case "CustomerDDANo":
                $('#previewModal #CustomerDDANo_' + uniqueId).html(result.sB_Customer_DDANo);
                break;
            case "CustomerAlies":
                $('#previewModal #CustomerAlies_' + uniqueId).html(result.sB_Customer_Alias_Name);
                break;
            case "CustomerArea":
                $('#previewModal #CustomerArea_' + uniqueId).html(result.sB_Area);
                break;

            //Document
            case "DocClass":
                $('#previewModal #DocClass_' + uniqueId).html(result.sB_Doc_Class);
                break;
            case "DocUserName":
                $('#previewModal #DocUserName_' + uniqueId).html(result.sB_Ent_User);
                break;
            case "DocEntryDateTime":
                $('#previewModal #DocEntryDateTime_' + uniqueId).html(result.sB_Ent_DateTime);
                break;
            case "DublicateBillCaption":
                var caption = "";
                if (result.sB_Print_Count > 1) {
                    caption = "Copy of Original ( " + result.sB_Print_Count + " )";
                } else {
                    caption = "";
                }

                $('#previewModal #DublicateBillCaption_' + uniqueId).html(caption);
                break;


            //Sales Bill
            case "SBNo":
                $('#previewModal #SBNo_' + uniqueId).html(result.sB_No);
                break;
            case "SBDate":
                $('#previewModal #SBDate_' + uniqueId).html(result.sB_Date);
                break;
            case "SBMiti":
                $('#previewModal #SBMiti_' + uniqueId).html(result.sB_Miti);
                break;
            case "SBChallanNo":
                $('#previewModal #SBChallanNo_' + uniqueId).html(result.sB_Challan_No);
                break;
            case "SBSubLedger":
                $('#previewModal #SBSubLedger_' + uniqueId).html(result.sB_SubLedger);
                break;
            case "SBSubLedgerBal":
                $('#previewModal #SBSubLedgerBal_' + uniqueId).html(result.SB_Customer_Current_Balance);
                break;
            case "SBCurrency":
                $('#previewModal #SBCurrency_' + uniqueId).html(result.sB_Currency);
                break;
            case "SBCurrencyRate":
                $('#previewModal #SBCurrencyRate_' + uniqueId).html(result.sB_Rate);
                break;
            case "SBDueDate":
                $('#previewModal #SBDueDate_' + uniqueId).html(result.sB_Due_Date);
                break;
            case "SBDispatchDate":
                $('#previewModal #SBDispatchDate_' + uniqueId).html(result.sB_Date);  //not
                break;
            case "SBMR":
                $('#previewModal #SBMR_' + uniqueId).html(result.sB_Mr);
                break;
            case "SBCompany":
                $('#previewModal #SBCompany_' + uniqueId).html(result.sB_Company);
                break;

            case "SBQuatationNo":
                $('#previewModal #SBQuatationNo_' + uniqueId).html(result.sB_Quotation);
                break;
            case "SBOrderNo":
                $('#previewModal #SBOrderNo_' + uniqueId).html(result.sB_Order_No);
                break;
            case "SBCNNo":
                $('#previewModal #SBCNNo_' + uniqueId).html(result.sB_CNNo);
                break;
            case "SBTruckNo":
                $('#previewModal #SBTruckNo_' + uniqueId).html(result.sB_Truck_No);
                break;
            case "SBDriverLicenseNo":
                $('#previewModal #SBDriverLicenseNo_' + uniqueId).html(result.sB_Date);
                break;
            case "SBDriverName":
                $('#previewModal #SBDriverName_' + uniqueId).html(result.sB_Driver_Name);
                break;
            case "SBTransport":
                $('#previewModal #SBTransport_' + uniqueId).html(result.transport);
                break;
            case "SBCashCreditMemo":
                $('#previewModal #SBCashCreditMemo_' + uniqueId).html(result.sB_Date);  //not
                break;
            case "SBBalance":
                $('#previewModal #SBBalance_' + uniqueId).html(result.sB_Date);  //not
                break;
            case "SBBasicAmount":
                $('#previewModal #SBBasicAmount_' + uniqueId).html(result.sB_Basic_Total);
                break;
            case "SBTermAmount":
                $('#previewModal #SBTermAmount_' + uniqueId).html(result.sB_Date);  //not
                break;
            case "SBLocalAmount":
                $('#previewModal #SBLocalAmount_' + uniqueId).html(result.sB_Date);  //not
                break;
            case "SBDueDays":
                $('#previewModal #SBDueDays_' + uniqueId).html(result.sB_Due_Days);
                break;
            case "SBTaxInvoiceType":
                var invoiceType = "";
                if (companyModel.tax_Billing == 1) {
                    invoiceType = "Tax Invoice";
                } else {
                    invoiceType = "";
                }
                $('#previewModal #SBTaxInvoiceType_' + uniqueId).html(invoiceType);
                break;
            case "SBTotalForeignCurrency":
                $('#previewModal #SBTotalForeignCurrency_' + uniqueId).html(result.sB_Date);  //not
                break;
            case "SBTotalLocalCurrency":
                $('#previewModal #SBTotalLocalCurrency_' + uniqueId).html(result.sB_Date);  //not
                break;
            case "SBPrintNo":
                $('#previewModal #SBPrintNo_' + uniqueId).html(result.sB_Print_Count);
                break;
            case "SBRemarks":
                $('#previewModal #SBRemarks_' + uniqueId).html(result.Remarks);
                break;
            case "SBAmountInWords":
                $('#previewModal #SBAmountInWords_' + uniqueId).html(numberToWords(result.sB_Net_Pay));
                break;
            case "SBBranch":
                $('#previewModal #SBBranch_' + uniqueId).html(result.sB_Branch);
                break;
            case "SBTotalAmount":
                $('#previewModal #SBTotalAmount_' + uniqueId).html(result.sB_Net_Pay);
                break;


            case "NonTaxableAmount":
                $('#previewModal #NonTaxableAmount' + uniqueId).html(result.sB_Net_Pay); // not found
                break;
            case "TaxableAmount":
                $('#previewModal #TaxableAmount_' + uniqueId).html(result.sB_Net_Pay); // not found
                break;
            case "VatPer":
                $('#previewModal #VatPer' + uniqueId).html((result.sB_Net_Pay ?? '0').toFixed(decimalToFixed)); // not
                break;
            case "VatAmount":
                $('#previewModal #VatAmount' + uniqueId).html((result.sB_Net_Pay ?? '0').toFixed(decimalToFixed)); //not
                break;
            default:
                break;
        }
    });


    //For details
    var details = result.salesBillDetailsList;
    var rowIndex = 0;
    if (details.length > 0) {

        for (let i = 0; i < (details.length - 1); i++) {
            var detailsRowHtml = $("#previewModalBody #dvDetails #dw_0").clone();

            rowIndex++;
            var detailNewId = "dw_" + rowIndex;
            detailsRowHtml.attr("id", detailNewId);

            var uniqueId = generateUniqueId();
            detailsRowHtml.find('[id].item-wrapper').each(function () {
                var oldId = $(this).attr('id');

                if (oldId) {
                    $(this).attr('id', uniqueId);

                    // Find child elements with IDs and update them
                    $(this).find('[id].details').each(function () {
                        var childOldId = $(this).attr('id');

                        if (childOldId && childOldId.includes('_')) {
                            var idType = childOldId.split('_')[0];
                            var childNewId = idType + "_" + uniqueId;

                            $(this).attr('id', childNewId);
                        }
                    });
                }
            });

            // Append the cloned row to the desired location
            $("#previewModalBody #dvDetails").append(detailsRowHtml);
        }

        //Adhust each row gap
        adjustDetailsRowGap();
        $("#previewModalBody #dvDetails .details-wrapper").each(function (wIndex) {
            $(this).find("label.details").each(function () {
                let itemId = $(this).attr('id');
                if (!itemId) return;

                var idType = itemId.split('_')[0];
                var uniqueId = itemId.split('_')[1];

                switch (idType) {
                    case "SN":
                        $('#previewModal #SN_' + uniqueId).html((wIndex + 1));
                        break;
                    case "ProductName":
                        $('#previewModal #ProductName_' + uniqueId).html(details[wIndex].product_Name);
                        break;
                    case "ProductAlies":
                        $('#previewModal #ProductAlies_' + uniqueId).html(details[wIndex].alias_Code);
                        break;
                    case "ProductUnit":
                        $('#previewModal #ProductUnit_' + uniqueId).html(details[wIndex].sB_Unit);
                        break;
                    case "Packing":
                        $('#previewModal #Product_Packing' + uniqueId).html(details[wIndex].product_Packing);
                        break;
                    case "Batch":
                        $('#previewModal #Batch_' + uniqueId).html(details[wIndex].sB_Batch);
                        break;
                    case "Expiry":
                        $('#previewModal #Expiry' + uniqueId).html(details[wIndex].sB_Expiry_Date);
                        break;


                    case "GodownName":
                        $('#previewModal #GodownName_' + uniqueId).html(details[wIndex].SB_Godown);
                        break;
                    case "GodownCode":
                        $('#previewModal #GodownCode_' + uniqueId).html(details[wIndex].SB_GodownCode);
                        break;
                    case "Quantity":
                        $('#previewModal #Quantity_' + uniqueId).html((details[wIndex].sB_Quantity ?? '0').toFixed(decimalToFixed));
                        break;
                    case "FreeQuantity":
                        $('#previewModal #FreeQuantity' + uniqueId).html((details[wIndex].sB_Free_Quantity ?? '0').toFixed(decimalToFixed));
                        break;
                    case "Rate":
                        $('#previewModal #Rate_' + uniqueId).html((details[wIndex].sB_Rate ?? '0').toFixed(decimalToFixed));
                        break;
                    case "Amount":
                        $('#previewModal #Amount_' + uniqueId).html((details[wIndex].sB_Amount ?? '0').toFixed(decimalToFixed));
                        break;

                    case "BatchMRP":
                        $('#previewModal #BatchMRP' + uniqueId).html((details[wIndex].sB_Batch ?? '0').toFixed(decimalToFixed));
                        break;
                    case "ProductMRP":
                        $('#previewModal #ProductMRP' + uniqueId).html((details[wIndex].sB_MRP ?? '0').toFixed(decimalToFixed));
                        break;
                    case "ProductDisPer":
                        $('#previewModal #ProductDisPer_' + uniqueId).html((details[wIndex].sB_Discount ?? '0').toFixed(decimalToFixed));
                        break;
                    case "ProductDisAmount":
                        $('#previewModal #ProductDisAmount_' + uniqueId).html((details[wIndex].sB_Discount_Amount ?? '0').toFixed(decimalToFixed));
                        break;
                    case "ExciseRate":
                        $('#previewModal #ExciseRate_' + uniqueId).html((details[wIndex].sB_ExciseRate ?? '0').toFixed(decimalToFixed));
                        break;
                    case "ExciseAmount":
                        $('#previewModal #ExciseAmount_' + uniqueId).html(details[wIndex].ExciseAmount); // not found
                        break;

                    default:
                        break;
                }
            });
        });
    }

    //For Bill Terms
    var billTerms = result.salesBillTermsList;
    if (billTerms.length > 0) {
        debugger
        $('#previewModalBody #dvTerms').find('.item-wrapper').each(function () {
            var textareaId = $(this).children().attr("id");
            if (!textareaId) return;

            var idType = textareaId.split('_')[0];
            var uniqueId = textareaId.split('_')[1];

            var matchedTerm = billTerms.find(function (term) {
                return term.termDescKey === idType;
            });
            // If a matching term is found, retrieve the term_Amt value
            var termAmtValue = matchedTerm ? matchedTerm.term_Amt : "";

            $('#previewModalBody #' + textareaId).html(termAmtValue)
        });
    }

}

function adjustDetailsRowGap() {

    var top = 0;
    var totalHeight = 0;
    var rowHeight = parseFloat($("#txtEachRowGap").val()) || 20;
    $('.dv-details > .details-wrapper:not(#dw_0)').each(function () {

        let css = $(this).children('.item-wrapper').attr("style");
        top = parseFloat(extractStyleValue(css, "top"));

        if (totalHeight == 0) {
            top += rowHeight;
            totalHeight = top;
        } else {
            totalHeight += rowHeight;
        }

        $(this).children('.item-wrapper').each(function () {
            $(this).css('top', totalHeight);
        });
    });
}


$("#btnResetDesign").click(function () {
    $("#btnLoadReport").click();
});
$("#btnDraftSave").click(function () {
    var calledBy = $(this).attr('id');
    saveDesign(calledBy);
});

function showDetailsToolBox() {
    $("#detailToolbox").slideDown("show");
}

function validateDecimal() {
    var no = parseInt($("#txtDecimalNo").val());
    if (no > 4) {
        $("#txtDecimalNo").val('').focus();
    }
}


