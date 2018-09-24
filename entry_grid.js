//************************************************************
//    https://www.entrygridjs.com  
//    Copyright (c) 2018 Bernard Dungog Peligro
//    EntryGrid JS
//    Version 1.0
//    MIT License https://en.wikipedia.org/wiki/MIT_License
//************************************************************

(function( $ ) {
    jQuery.fn.entry_grid = function( options ) {

        var defaults = {
            container: this, //this the target element to constuct entry_grid that is bind upon construction
            headers: [],
            rows: [],
            editable: true,

            wrapper_attrs: {
                class: "entry-grid-container"
            },
            wrapper_css: {},

            // We define an empty anonymous function so that
            // we don't need to check its existence before calling it.
            on_change : function(){on_change();},
            on_delete : function(){delete_row();},
            on_create : function(){create_row();},
            on_search_select : function($selected_id,$colno,$rowno){},

        };

        var get_columns = function(){
            return col_cont;
        };

        this.get_data = function(){
            return get_data_();
        };

        var create_row = function(){

        };

        this.update_value = function($rowno,$colno,$value){
            update_value($rowno,$colno,$value);
        };

        this.get_value = function($rowno,$colno){
            return get_value($rowno,$colno);
        };

        this.current_colno = function(){
            return g_current_colno;
        };

        this.current_rowno = function(){
            return g_current_rowno;
        };

        this.current_selected_id = function(){
            return g_selected_item_id;
        };

        this.clear_previous_cell_control = function(){
            clear_previous_cell_control();
        };

        var delete_row = function(){

        };

        var on_search_select = function($selected_id,$colno,$rowno){
            
        };

        var on_change = function($colno,$rowno){

        }


        // We can use the extend method to merge options/settings as usual:
        // But with the added first parameter of TRUE to signify a DEEP COPY:
        var settings = $.extend( true, {}, defaults, options );

        var headers_objects = [], rows_objects = [], row_count=0, container_width=0,header_offset=null,header_row_cont=0,last_vscroll=0;
        var cont_width = parseInt(settings.container.css("width"));
        var cont_left = parseInt(settings.container.css("left"));
        var cont_height = parseInt(settings.container.css("height")); 

        var header_count = 1, initialW=0, initialH=0, current_col_object="", current_col_width="", current_second_col_left="", current_third_col_left="";
        var col_cont = [], head_cont=[],viewport,header_row_container,headers, empty_headers, col_left_position = 40, head_left_position = 40;
        var gOrig_Fixed_Cols_height = "", clone_cur_object="", first_row_object="";

        var dropdown_lists = [],g_current_rowno=1,g_current_colno=1,g_selected_item_id="";

        //check for rows and header
        if(settings.rows.length<=0){
            alert("Please specify rows definition.");
            return;
        }
        if(settings.headers.length<=0){
            alert("Please specify headers definition.");
            return;
        }


        //construct the grid
        construct_grid();
        update_scrollbar();
        get_first_row(); //for adding new row later on
        create_new_row('trigger');

        //active cell counter clicks
        $(".entry-grid-cell-counter").off("click");
        $(".entry-grid-cell-counter").unbind("click");
        $(".entry-grid-cell-counter").click(function(){

            if(!settings.editable){
                return;
            }

            if(!$(this).hasClass("selected-row")){
               $(this).addClass("selected-row");
               update_selected_row($(this).attr("rowno"),'select');
            }else{
               $(this).removeClass("selected-row");
               update_selected_row($(this).attr("rowno"),'deselect');
            }

            if($(this).hasClass("last_row")){
               $(this).removeClass("selected-row");
            }
        });

        //activate escape key
        $(document).keyup(function(event){
            if(event.which==27){
                $(".search_container").remove();
                $(".pop_menu_").remove();
                clear_previous_cell_control();                
            }
        });


        //activate menu click
        $(".entry-grid-cell-counter-header").click(function(){
            show_pop_menu(this);
        });    

        return this;



        //===============================================
        //plugin functions begin    
        //===============================================
        function construct_grid() {

            var wrapper = $("<div />");
            header_row_container = $("<div />");
            header_row_container.attr({class:"eg-header-row-container"});
            header_row_container.css({width: cont_width+"px"});
            headers = create_headers();
            var padding = (8 * (settings.headers.length+1)) + 2;

            headers.css({width: container_width+padding+30});

            //add cell counter header
            var header_elem = $("<div />"); 
            header_elem.attr({class:"entry-grid-cell-counter-header", headno: 0});
            header_elem.html('...');
            header_elem.appendTo(header_row_container);

            headers.appendTo(header_row_container);
            header_row_container.appendTo(settings.container);

            var cell_counter_container = $("<div />");
            cell_counter_container.attr({class: "cell-counter-container"});
            cell_counter_container.appendTo(settings.container);

            var cell_counter_container_inner = $("<div />");
            cell_counter_container_inner.attr({class: "cell-counter-container-inner"});

            //create viewport container
            viewport = $("<div />");
            viewport.attr({class: "entry-grid-viewport"});
            viewport.appendTo(wrapper);

            //build cells 
            settings.rows.forEach(function(row){
                row_count++;

                var cell_elem = $("<div />"); 
                cell_elem.attr({class:"entry-grid-cell-counter", colno: 0, cell_type: "counter"});
                cell_elem.css({width: "40px"});
                cell_elem.html(row_count);
                cell_elem.appendTo(cell_counter_container_inner);

                var row = create_cells(row,row_count);

            });


            //append column with cells into viewport
            empty_headers = [];
            var first_col,colcount=1;
            col_cont.forEach(function(cols){
                if(colcount==1 || colcount==2){
                    first_col=cols;
                    fix_column(cols,colcount);
                    fix_header(colcount);
                }else{
                    cols.appendTo(viewport);
                }

                colcount++;
            });

            //append fixed headers to headers
            empty_headers.reverse();
            empty_headers.forEach(function(empty_heads){
                empty_heads.prependTo(headers);
            });

            //add everything to target container
            cell_counter_container_inner.appendTo(cell_counter_container);
            wrapper.attr(settings.wrapper_attrs);
            wrapper.css(settings.wrapper_css);
            wrapper.appendTo(settings.container); 

            $(settings.container).css("z-index",3);
            $(settings.container).css({overflow: "hidden", border: "1px solid #ccc"});

            //bind scroll event
            $(".entry-grid-container").on("scroll",handle_scroll);
 
            header_offset = $(".eg-header-row").offset();
            header_row_cont = $(".eg-header-row-container").offset();
            cell_counter_container.css({height: (cont_height-56)+"px"});
            $(".entry-grid-container").css({height: (cont_height-36)+"px", width: cont_width+"px"});

            //handle column resize 
            col_resize_event();

            //get original fixed columns height
            gOrig_Fixed_Cols_height = $(".fixed-column-container").height();

            //activate sortables
            $("#non-fixed-header").sortable({
                placeholder: "col-header-placeholder", 
                connectWith: ".entry-grid-header", 
                axis: "x",
                cancel: "span.col-resize-handle",
                dropOnEmpty: false,
                distance: 5,
                containment: "#non-fixed-header",
                forcePlaceholderSize: true,
                forceHelperSize: true,
                helper: "clone",
                start: function(event,ui){ 
                    $(ui.helper).addClass("col-header-drag-bg");
                },
                stop: function(event,ui){ 
                    $(ui.helper).removeClass("col-header-drag-bg");
                },
                update: function(event, ui){
                    update_column_position();
                },
            });
            $(".eg-header-row").disableSelection();

            //activate cells click
            cells_on_click();

        }

        function update_column_position(){
            var header_arrangements = $(".eg-header-row .entry-grid-header");
            var column_arrangements = $(".entry-grid-viewport .column-container");

            $(header_arrangements).each(function(head_position,v){
                var headno = $(v).attr("headno");
                $(column_arrangements).each(function(i2,v2){
                    var col_no = $(v2).attr("col_no");
                    if((Number(col_no)==Number(headno)) && (head_position==i2)){
                        return false;//break
                    }

                    //search the position of the colum base on its head and put it on the same column
                    var column_arrangements_current = $(".entry-grid-viewport .column-container");
                    var siblings_count = 0;
                    var col_object = "";
                    $(column_arrangements_current).each(function(i3,v3){
                        siblings_count++;
                        var col_no2 = $(v3).attr("col_no");
                        if(Number(col_no2)==Number(headno)){
                            col_object = v3;
                            return false;//break
                        }
                    });

                    //move the column to the same position of its head
                    var traverse_object = "";
                    siblings_count = siblings_count-(head_position+1);
                    for(var j=0;j<siblings_count;j++){
                        traverse_object = $(col_object).prev();
                    }

                    $(col_object).insertBefore(traverse_object);

                });
            });

        }

        function col_resize_event(){

            $('.col-resize-handle').mousedown(function(e){
                //initialW = Number($(this).parent().width());
                //initialH = Number($(this).parent().height());
                initialW = e.pageX;
                initialH = e.pageY;
                current_col_object = this;
                current_col_width = $(current_col_object).parent().width();
                current_second_col_left = $(".eg-header-row-container").children(":nth-child(4)").position().left-9; //this is for the first fixed column adjustment
                current_third_col_left = $(".entry-grid-viewport").position().left;
    
                document.addEventListener('mousemove', resize_col_and_header, false);
                document.addEventListener('mouseup', stop_drag, false);    
                document.addEventListener('selectstart', no_select_text, false);            
            });


            /*
            $('.col-resize-handle').mousemove(function(e){
                if(clicking == false) return;
                //console.log('clicking and mouse moving/dragging');
                resize_col_and_header(e);
            });
            */

        }

        function resize_col_and_header(e){
            var w = initialW - e.pageX;
            var h = initialH - e.pageY;
            var interacting_width = current_col_width;
            var interacting_left = current_second_col_left;
            var interacting_left_3 = current_third_col_left;

            if(Number(w)>0){
                interacting_width = current_col_width-w;
                interacting_left = current_second_col_left-w;
                interacting_left_3 = current_third_col_left-w;
            }else{
                interacting_width = current_col_width+Math.abs(w);
                interacting_left = current_second_col_left+Math.abs(w);
                interacting_left_3 = current_third_col_left+Math.abs(w);
            }

            //check min width
            if (interacting_width <= 100) {
                return;
            }

            //resize widths for col, header and cells
            var headno = $(current_col_object).parent().attr("headno");
            $(current_col_object).parent().css({
                'width': interacting_width+"px",
            });

            //resize normal columns
            $(".column-container."+headno).css({'width': interacting_width+"px"});

            //resize row header width too
            var eg_row_width = $(".eg-header-row").width();
            $(".eg-header-row").css({'width': (Number(eg_row_width)+Number(interacting_width))+"px"});

            //check if this col is fixed then resize the fixed header container as well
            var col_is_fixed = $(current_col_object).parent().parent();
            if($(col_is_fixed).hasClass("fixed-header-container")){

                $(col_is_fixed).css({'width': interacting_width+"px"});
                $(".fixed-column-container."+headno).css({'width': interacting_width+"px"});

                //update the empty headers width too
                $(col_is_fixed).parent().children(":nth-child(2)").children(":nth-child("+headno+")").css({'width': (interacting_width)+"px"});
                
                //move left of second fixed header and column
                if(Number(headno)==1){
                    $(".eg-header-row-container").children(":nth-child(4)").css({'left': interacting_left+"px"});
                    $(".fixed-column-container.2").css({'left': interacting_left+"px"});
                }

                var sec_fixed_col_width = $(".fixed-column-container.2").width();
                var sec_fixed_col_left = $(".fixed-column-container.2").position().left;

                $(".entry-grid-viewport").css({'left': (Number(sec_fixed_col_width)+Number(sec_fixed_col_left))+"px"});


            }


            //stretch fix columns height if there is no scrollbar below
            update_scrollbar();
 
        }
        
        function update_scrollbar(){
            var container = $(".entry-grid-container");
            if(!container.hasHScrollBar()){
                var fixed_cols = $(".fixed-column-container");
                $(fixed_cols).css({"height":(gOrig_Fixed_Cols_height+20)+"px"});
                $(".cell-counter-container").css({"height":(gOrig_Fixed_Cols_height+20)+"px"});
                //console.log("a");
            }else{
                var fixed_cols = $(".fixed-column-container");
                $(fixed_cols).css({"height": gOrig_Fixed_Cols_height+"px"});
                $(".cell-counter-container").css({"height":(gOrig_Fixed_Cols_height)+"px"});
                //console.log("b");
            }
        }

        function cells_on_click(e){

            if(settings.editable){

                $(".entry-grid-cell").unbind("click");
                $(".entry-grid-cell").off("click");
                $(".entry-grid-cell").click(function(e){

                    if($(e.target).is(".input_control") || $(e.target).is("input") || $(e.target).is("select") || $(e.target).is("option") || $(e.target).is("span.last_row") || $(e.target).is("div.last_row") || $(this).children(":first-child").hasClass("eg-checkbox")){
                            
                        if($(this).children(":first-child").hasClass("eg-checkbox")){
                           return;
                        }else{
                            return false;
                        }    
                    }

                    var rowno = $(this).attr("rowno");
                    if(rowno=="*"){
                        return;
                    }

                    clear_previous_cell_control();

                    //show appropriate control in the cell
                    var cell_type = $(this).attr("cell_type");
                    var readonly = $(this).attr("readonly");
                    var placeholder = $(this).attr("placeholder");
                    var value = $(this).html();
                    var colno = $(this).attr("colno");

                    g_current_rowno = rowno;
                    g_current_colno = colno;                    

                    if(readonly){
                        return false;
                    }


                    if(cell_type=="text" || cell_type=="numeric"){
                        $(this).attr("data-value",value);
                        $(this).html("");
                        var input_control = $('<input type="text" class="input_control" cell_type="'+cell_type+'" style="text-align:right;" placeholder="'+placeholder+'"/>');
                        input_control.css({width:"100%", height: "97%", "margin-top":"-2px", "margin-left":"-4px"});
                        input_control.val(value);
                        input_control.appendTo($(this));
                        input_control.on("focus", function(){this.setSelectionRange(0, this.value.length)});                        
                        input_control.focus();
                    }

                    //checkbox no need to creat.
                    if(cell_type == "checkbox"){
                        $(this).attr("data-value",value);

                        var checked = "";
                        if(Number(value)==1){
                            checked = ' checked="" ';
                        }
                        var input_control = $('<input type="checkbox" name="chkbox" class="input_control eg-checkbox" cell_type="'+cell_type+'" '+checked+' />');
                        input_control.css({width:"100%", height: "90%", padding: "3px", "margin-top":"-2px", "margin-left":"-4px"});
                        input_control.appendTo($(this));

                    }

                    if(cell_type=="dropdown"){
                        $(this).attr("data-value",value);
                        $(this).html("");
                        var input_control = $('<select class="input_control" cell_type="'+cell_type+'" placeholder="'+placeholder+'"/>');
                        input_control.css({width:"100%", height: "97%", "margin-top":"-2px", "margin-left":"-4px"});
                        input_control.val("");
                        input_control.appendTo($(this));
                        input_control.focus();  

                        //load list items
                        var list = dropdown_lists[colno];
                        var count = 1;
                        list.list.forEach(function(list_){
                            var item_list = $('<option />');
                            if(count==1){
                                item_list.attr("selected",true);
                            }
                            item_list.attr({"eg-data-id": list_.id, "eg-data-name": list_.name});
                            item_list.html(list_.name);
                            item_list.appendTo(input_control);
                            count++;
                        });

                        input_control.val(value);

                    }

                    if(cell_type=="datepicker"){
                        $(this).attr("data-value",value);
                        $(this).html("");
                        var input_control = $('<div class="sandbox-container"><input type="text" cell_type="'+cell_type+'" class="input_control" placeholder="'+placeholder+'"/></div>');
                        input_control.css({width:"100%", height: "100%","margin-top":"-2px", "margin-left":"-3px"});
                        input_control.children(".input_control").css({width:"100%", height: "97%"});
                        input_control.appendTo($(this));

                        var date_format = $(this).attr("date-format");
                        if(!date_format){
                            date_format = "dd/mm/yyyy";
                        }
                        var date_format_ = date_format.split("/");

                        var today = new Date();
                        var dd = today.getDate();
                        var mm = today.getMonth()+1; //January is 0!
                        var yyyy = today.getFullYear();

                        if(value=="&nbsp;"){
                            var value_ = "";
                            if(date_format_[0].toLowerCase()=="dd"){
                                value_ += dd + "/";
                            }
                            if(date_format_[0].toLowerCase()=="mm"){
                                value_ += mm + "/";
                            }
                            if(date_format_[0].toLowerCase()=="yyyy"){
                                value_ += yyyy + "/";
                            }

                            if(date_format_[1].toLowerCase()=="dd"){
                                value_ += dd + "/";
                            }
                            if(date_format_[1].toLowerCase()=="mm"){
                                value_ += mm + "/";
                            }
                            if(date_format_[1].toLowerCase()=="yyyy"){
                                value_ += yyyy + "/";
                            }

                            if(date_format_[2].toLowerCase()=="dd"){
                                value_ += dd;
                            }
                            if(date_format_[2].toLowerCase()=="mm"){
                                value_ += mm;
                            }
                            if(date_format_[2].toLowerCase()=="yyyy"){
                                value_ += yyyy;
                            }

                        }else{
                            value_ = value;
                        }


                        $('.sandbox-container input').datepicker({
                            format: date_format,
                            autoclose: true,
                            todayHighlight: true,
                        });

                        input_control.children(".input_control").val(value_);
                        input_control.children(".input_control").focus();  

                    }

                    if(cell_type=="search"){
                        if(value=="&nbsp;"){
                            var value = "";
                        }
                            
                        $(this).attr("data-value",value);
                        $(this).html("");
                        var input_control = $('<input type="text" class="input_control" cell_type="'+cell_type+'" placeholder="'+placeholder+'"/>');
                        input_control.css({width:"100%", height: "97%", "margin-top":"-2px", "margin-left":"-4px"});
                        input_control.val(value);
                        input_control.appendTo($(this));
                        input_control.on("focus", function(){this.setSelectionRange(0, this.value.length)});                        
                        input_control.focus();

                    }

                    //bind enter key to proceed to focus on the next control available
                    $(input_control).unbind("keyup");
                    $(input_control).off("keyup");
                    $(input_control).keyup(function(event){
                        if(event.which==13 || event.which==9) {
                            focus_on_next_control(this);
                            event.preventDefault();
                        }

                        if(cell_type=="search"){
                            search_this_item(this);
                        }
                    });


                    if(cell_type=="dropdown"){
                        $(input_control).children().unbind("keyup");
                        $(input_control).children().off("keyup");
                        $(input_control).children().keyup(function(event){
                            if(event.which==13 || event.which==9) {
                                focus_on_next_control(this);
                                event.preventDefault();
                            }
                        });
                    }

                    if(cell_type=="datepicker"){
                        $(input_control).children(".input_control").unbind("keyup");
                        $(input_control).children(".input_control").off("keyup");
                        $(input_control).children(".input_control").keyup(function(event){
                            if(event.which==13 || event.which==9) {
                                focus_on_next_control(this);
                                event.preventDefault();
                            }
                        });
                    }

                    $(input_control).unbind("blur");
                    $(input_control).off("blur");
                    $(input_control).blur(function(){
                        if(cell_type!=="search"){
                            clear_previous_cell_control();
                        }
                        settings.on_change(this);
                    });

                    if(cell_type == "checkbox"){
                        $(input_control).change(function(){
                            if($(this).is(":checked")){
                                $(this).parent().attr("data-value","1");
                            }else{
                                $(this).parent().attr("data-value","0");
                            }
                        });
                    }

                });
            }


            //this will remove the dropdown list of the search type cell
            $(document).click(function(e){
                $(".search_container").remove();
            });
        }

        function search_this_item($thisObject){
            $(".search_container").remove();

            //seach_list;
            var colno = $($thisObject).parent().attr("colno");
            var rowno = $($thisObject).parent().attr("rowno");
            var input_box_location = $($thisObject).offset();
            var list = dropdown_lists[colno];

            var search_container = $("<div />");
            search_container.addClass("search_container");
            search_container.css({top:(Number(input_box_location.top)+34)+"px", left: (Number(input_box_location.left)-1)+"px"});

            var table = $('<table cellspacing="2"/>');

            var header_row = $('<tr />');
            var counter = 1;
            list.list.forEach(function(list_){
                if(counter==1){
                    for(var item in list_){
                        var header = $('<th />');
                        header.html(item.toUpperCase());
                        header.appendTo(header_row);
                    };
                }
                counter++;
            });
            header_row.appendTo(table);
                
            list.list.forEach(function(list_){
                var item_list_row = $('<tr class="search-list-item"/>');
                item_list_row.attr({"eg-data-id": list_.id, "eg-data-name": list_.name});
                var combine_info = "",found_count=0;
                for(var item in list_){
                    var item_list = $('<td />');
                    var data = "";
                    //check for array type then just get the first element
                    if(Array.isArray(list_[item])){
                        $(list_[item]).each(function(i,sub_item){
                            var keys = Object.keys(sub_item);
                            data = sub_item[keys[0]];
                            return false;
                        });
                    }else{
                        data = list_[item];
                    }

                    item_list.html(data);
                    item_list.appendTo(item_list_row);
                    combine_info += data;
                };

                //check if search string is found
                var search_this = $($thisObject).val().replace("\\","");
                var regex = new RegExp(search_this, 'gi');
                var found = combine_info.match(regex);
                if(found){
                    found_count++;
                    item_list_row.appendTo(table);
                }      


            });

            table.appendTo(search_container);
            search_container.appendTo("body");

            $(".search-list-item").unbind("click");
            $(".search-list-item").off("click");
            $(".search-list-item").click(function(e){
                var selected_id = $(this).attr("eg-data-id");
                if(!selected_id){
                    preventDefault();
                    return false;
                }

                $($thisObject).val(selected_id);
                $(search_container).remove();

                clear_previous_cell_control();
                //call user function upon selecting from the search list

                g_selected_item_id = $(this).attr("eg-data-id");
                settings.on_search_select($(this).attr("eg-data-id"),colno,rowno);
            });

        }

        function show_pop_menu($thisObject){
            $(".pop_menu_").remove();

            var menu_button_location = $($thisObject).offset();
            var menu_container = $("<div />");
            menu_container.addClass("pop_menu_");
            menu_container.css({top:(Number(menu_button_location.top)+34)+"px", left: (Number(menu_button_location.left)-1)+"px"}); 
            menu_container.appendTo("body");     

            var menu_item_delete = $('<div class="eg_menu_item" data-menu-item="delete_selected_row" />');      
            var menu_item_sort = $('<div class="eg_menu_item" data-menu-item="record_sort" />');      
            var menu_item_hide_columns = $('<div class="eg_menu_item" data-menu-item="hide_columns" />');   
            menu_item_delete.html('<div class="delete_icon"/></div>Delete Selected Rows');   
            menu_item_hide_columns.html('<div class="hide_column_icon"/></div>Hide/Show Columns');   
            menu_item_sort.html('<div class="sort_menu_icon"/></div>Sort Column');

            menu_item_delete.appendTo(menu_container);
            menu_item_hide_columns.appendTo(menu_container);
            menu_item_sort.appendTo(menu_container);

            $(document).click(function(e){
                if($(e.target).is(".entry-grid-cell-counter-header")){
                    return false;
                }
                $(".pop_menu_").remove();
            });

            $(".eg_menu_item").click(function(){
                menu_action(this);
            });
        }

        function menu_action($this){
            if($($this).attr("data-menu-item")=="delete_selected_row"){
                //check for selected rows
                var selected_rows=[];
                $(".selected-row").each(function(){
                    selected_rows.push({row: this});
                });

                if(Number(selected_rows.length)<=0){
                    alert("Please select rows to delete by clicking the cell number.");
                    return;
                }
                if(!confirm("Are you sure you want to delete the selected rows?")){
                    return;
                }

                //delete row
                selected_rows.forEach(function(cell){
                    $(cell.row).remove();
                });

 
                //update row numbers. columns remains as is
                var count = 0;
                $(".entry-grid-cell-counter").each(function(){
                    if($(this).hasClass("last_row")){
                        return false;
                    }

                    count++;
                    $(this).attr("rowno",count);
                    $(this).html(count);
                });

                $(".column-container-inner").each(function(i,col_container){
                    count = 0;
                    $(col_container).find(".entry-grid-cell").each(function(){
                        if($(this).hasClass("last_row")){
                            return false;
                        }

                        count++;
                        $(this).attr("rowno",count);
                    });
                })

            }


            if($($this).attr("data-menu-item")=="hide_columns"){
                hide_columns($this);
            }


            if($($this).attr("data-menu-item")=="record_sort"){
                sort_columns_elements($this);
            }
        }

        function sort_columns_elements($this){
            $(".columns_selection").remove();


            var menu_button_location = $($this).offset();
            var menu_container = $("<div />");
            menu_container.addClass("columns_selection");
            var left = ($(window).width()/2) - ($(menu_container).width()/2);
            var container_location = $(settings.container).offset();
            menu_container.css({position: "absolute", top: (Number(container_location.top)+20)+"px", left: left+"px"}); 
            menu_container.appendTo("body");     

            var header_div = $('<div style="background: #c7d0dd; padding:10px 8px;font-weight:bold;font-size:16px; cursor: move" id="title_holder"/>');
            header_div.html("Select a Column to Sort");
            header_div.appendTo(menu_container);

            var menu_div = $('<div style="height:300px;overflow:auto;padding:0px;"/>');

            //load columns names
            var count=0;
            settings.headers.forEach(function(col_name){
                count++;

                var menu_item = $('<div class="eg_menu_item" data-menu-item="'+col_name.name+'" data-colno="'+count+'" />');      
                menu_item.html(col_name.name); 
                menu_item.appendTo(menu_div);

            });  
 
            menu_div.appendTo(menu_container);

            var button_div = $('<div style="padding:10px;text-align:right;border-top: 1px solid #CCC;"/>');
            var button1 = $('<button class="btnSortASC eg_button" style="margin-right:4px;"/>');
            button1.html("Sort Ascending");
            var button2 = $('<button class="btnSortDESC eg_button" style="margin-right:4px;"/>');
            button2.html("Sort Descending");
            var button3 = $('<button class="eg_button"/>');
            button3.html("Cancel");

            button1.appendTo(button_div);
            button2.appendTo(button_div);
            button3.appendTo(button_div);
            button_div.appendTo(menu_container);

            $(document).click(function(e){
                if($(e.target).is(".eg_menu_item") || $(e.target).is(".btnHideColumns") || $(e.target).is(".btnShowColumns")){
                    return false;
                }
                $(".columns_selection").remove();
            });

            $(".btnSortASC").click(function(){
                //remove previous sort icon
                $(".sort-icon").remove();

                $(".selected_menu").each(function(){
                    var selected_colno = $(this).attr("data-colno");
                    if(Number(selected_colno>2)){
                        $("#non-fixed-header").find(".entry-grid-header").each(function(){
                            var headno = $(this).attr("headno");
                            var data_type = $(this).attr("type");
                            if(Number(selected_colno)==Number(headno)){
                                var sort_icon = $('<div class="sort_asc_icon sort-icon"/></div>');
                                sort_icon.insertBefore($(this).find(".col-resize-handle"));

                                sort_column_cells(data_type,headno,"asc");
                            }
                        });
                    }

                    //iterate fixed header too                    
                    if(Number(selected_colno<=2)){
                        $(".fixed-header-container").find(".entry-grid-header").each(function(){
                            var headno = $(this).attr("headno");
                            var data_type = $(this).attr("type");
                            if(Number(selected_colno)==Number(headno)){
                                var sort_icon = $('<div class="sort_asc_icon sort-icon"/></div>');
                                sort_icon.insertBefore($(this).find(".col-resize-handle"));

                                sort_column_cells(data_type,headno,"asc");
                            }
                        });
                    }    
                });

                $(".columns_selection").remove();
            });


            $(".btnSortDESC").click(function(){
                //remove previous sort icon
                $(".sort-icon").remove();

                $(".selected_menu").each(function(){
                    var selected_colno = $(this).attr("data-colno");
                    if(Number(selected_colno>2)){
                        $("#non-fixed-header").find(".entry-grid-header").each(function(){
                            var headno = $(this).attr("headno");
                            var data_type = $(this).attr("type");
                            if(Number(selected_colno)==Number(headno)){
                                var sort_icon = $('<div class="sort_desc_icon sort-icon"/></div>');
                                sort_icon.insertBefore($(this).find(".col-resize-handle"));

                                sort_column_cells(data_type,headno,"desc");
                            }
                        });
                    }

                    //iterate fixed header too                    
                    if(Number(selected_colno<=2)){
                        $(".fixed-header-container").find(".entry-grid-header").each(function(){
                            var headno = $(this).attr("headno");
                            var data_type = $(this).attr("type");
                            if(Number(selected_colno)==Number(headno)){
                                var sort_icon = $('<div class="sort_desc_icon sort-icon"/></div>');
                                sort_icon.insertBefore($(this).find(".col-resize-handle"));

                                sort_column_cells(data_type,headno,"desc");
                            }
                        });
                    }    
                });

                $(".columns_selection").remove();
            });


            $(".columns_selection .eg_menu_item").click(function(){
                //clear previous selection. we only need one column to select
                $(".columns_selection .eg_menu_item").each(function(){
                    $(this).removeClass("selected_menu");
                });

                if(!$(this).hasClass("selected_menu")){
                    $(this).addClass("selected_menu");
                }else{
                    $(this).removeClass("selected_menu");
                }
            });

            $( ".columns_selection" ).draggable({ handle: "#title_holder" });

        }

        function sort_column_cells($data_type,$column_no,$sort_order = "asc"){
            clear_previous_cell_control();

            //scirpts taken from https://stackoverflow.com/questions/13490391/jquery-sort-elements-using-data-id
            var column_container = $(".column-container."+$column_no+ " .column-container-inner"); 
            var cells_ = column_container.children('div.entry-grid-cell:not(.last_row)');
            var cells = cells_.clone(); 
            column_container.children('div.entry-grid-cell:not(.last_row)').remove();

            var cells_array = [];
            //need to create array from jquery objects in order to sort more than 20 rows
            $(cells).each(function(){
                var rowno = $(this).attr("rowno");
                var data_value = $(this).attr("data-value").toLowerCase();
                cells_array.push({rowno: rowno, data_value: data_value});
            });


            var result__ = [];
            if($sort_order=="asc"){
                result__ = Sorting.Utility.Sorter.sort(cells_array, function(a, b) {
                    var astts = a.data_value;
                    var bstts = b.data_value;

                    if($data_type=="datepicker"){
                        var astts = astts.split("/");
                        var bstts = bstts.split("/");
                        var date1 = new Date(astts[2]+"-"+astts[1]+"-"+astts[0]); //yyyy-mm-dd
                        var date2 = new Date(bstts[2]+"-"+bstts[1]+"-"+bstts[0]); //yyyy-mm-dd
                        date1 = Number(date1.getTime());
                        date2 = Number(date2.getTime());

                        return date1 > date2 ? 1 : date1 < date2 ? -1 : 0;

                    }else{
                        if($data_type=="numeric"){
                            var astts_ = Number(astts);
                            var bstts_ = Number(bstts);
                            return astts_ > bstts_ ? 1 : astts_ < bstts_ ? -1 : 0;
                        }else{
                            return astts > bstts ? 1 : astts < bstts ? -1 : 0;
                        }
                    }
                });

            }

            if($sort_order=="desc"){
                result__ = Sorting.Utility.Sorter.sort(cells_array, function(a, b) {
                    var astts = a.data_value;
                    var bstts = b.data_value;

                    if($data_type=="datepicker"){
                        var astts = astts.split("/");
                        var bstts = bstts.split("/");
                        var date1 = new Date(astts[2]+"-"+astts[1]+"-"+astts[0]); //yyyy-mm-dd
                        var date2 = new Date(bstts[2]+"-"+bstts[1]+"-"+bstts[0]); //yyyy-mm-dd
                        date1 = Number(date1.getTime());
                        date2 = Number(date2.getTime());

                        return date1 < date2 ? 1 : date1 > date2 ? -1 : 0;

                    }else{
                        if($data_type=="numeric"){
                            var astts_ = Number(astts);
                            var bstts_ = Number(bstts);
                            return astts_ < bstts_ ? 1 : astts_ > bstts_ ? -1 : 0;
                        }else{
                            return astts < bstts ? 1 : astts > bstts ? -1 : 0;
                        }
                    }

                });

            }


            //sort elements in the column intended to sort base on the sorted array [cells_array]
            $(result__).each(function(i,v){
                var row_no = v.rowno;
                $(cells).each(function(){
                    var row_no_ = $(this).attr("rowno");
                    if(Number(row_no)==Number(row_no_)){
                        if(settings.editable){
                            $(this).insertBefore($(column_container).find(".last_row"));
                        }else{
                            $(this).appendTo(column_container);
                        }
                        return false; //break
                    }
                });

            });


            //follow positions of the other cells to the new position of the current column being sorted
            $(column_container).children('div.entry-grid-cell:not(.last_row)').each(function(){
                var row_no = $(this).attr("rowno");

                $(".column-container").each(function(){
                    //no need to iterate the sorted column
                    if(!$(this).hasClass($column_no)){
                        var sort_this_column = $(this).find(".column-container-inner");
                        var column_cells = sort_this_column.children('div.entry-grid-cell:not(.last_row)');

                        $(column_cells).each(function(i,v){
                            //let look for same rowno
                            var rowno = $(v).attr("rowno");
                            if(Number(rowno)==Number(row_no)){
                                if(settings.editable){
                                    $(v).insertBefore($(sort_this_column).find(".last_row"));
                                }else{
                                    $(v).appendTo(sort_this_column);
                                }
                            }
                        });
                    }
                });

            });


            //remove previous selected class for the cell counters
            $(".entry-grid-cell-counter:not(.last_row)").each(function(){
                $(this).removeClass("selected-row");
            });

            //update cell counter rowno attribs
            var counter = 0;
            $(column_container).children('div.entry-grid-cell:not(.last_row)').each(function(){
                var row_no = $(this).attr("rowno");
                counter++;
                var count = 0;

                var is_selected = false;
                if($(this).hasClass("selected-row")){
                    is_selected = true;
                }

                $(".entry-grid-cell-counter:not(.last_row)").each(function(){
                    count++;
                    if(count==counter){
                        $(this).attr("rowno",row_no);
                        if(is_selected){
                            $(this).addClass("selected-row");
                        }
                        return false;
                    }
                });


            });

            //reactivate cells click event
            cells_on_click();

            $(".last_row").off("click");
            $(".last_row").unbind("click");
            $(".last_row").click(function(){
                create_new_row('new');
            });

        }


        function hide_columns($this){
            $(".columns_selection").remove();

            var menu_button_location = $($this).offset();
            var menu_container = $("<div />");
            menu_container.addClass("columns_selection");
            var left = ($(window).width()/2) - ($(menu_container).width()/2);
            var container_location = $(settings.container).offset();
            menu_container.css({position: "absolute", top: (Number(container_location.top)+20)+"px", left: left+"px"}); 
            menu_container.appendTo("body");     

            var header_div = $('<div style="background: #c7d0dd; padding:10px 8px;font-weight:bold;font-size:16px;cursor:move;" id="title_holder"/>');
            header_div.html("Select Columns to Hide/Show");
            header_div.appendTo(menu_container);

            var menu_div = $('<div style="height:300px;overflow:auto;padding:0px;"/>');

            //load columns names
            var count=0;
            settings.headers.forEach(function(col_name){
                count++;

                //we dont hide fixed columns
                if(count>2){
                    var is_hidden = false;
                    $("#non-fixed-header").find(".entry-grid-header").each(function(){
                        var headno = $(this).attr("headno");
                        if(Number(headno)==count && $(this).hasClass("hide_column")){
                            is_hidden = true;
                            return false; //break
                        }
                    });

                    var menu_item = $('<div class="eg_menu_item" data-menu-item="'+col_name.name+'" data-colno="'+count+'" />');      
                    menu_item.html(col_name.name); 
                    menu_item.appendTo(menu_div);

                    if(is_hidden){
                        $(menu_item).addClass("hidden_column");
                    }
                }
            });  
 
            menu_div.appendTo(menu_container);

            var button_div = $('<div style="padding:10px;text-align:right;border-top: 1px solid #CCC;"/>');
            var button1 = $('<button class="btnHideColumns eg_button" style="margin-right:4px;"/>');
            button1.html("Hide");
            var button2 = $('<button class="btnShowColumns eg_button" style="margin-right:4px;"/>');
            button2.html("Show");
            var button3 = $('<button class="eg_button"/>');
            button3.html("Cancel");

            button1.appendTo(button_div);
            button2.appendTo(button_div);
            button3.appendTo(button_div);
            button_div.appendTo(menu_container);

            $(document).click(function(e){
                if($(e.target).is(".eg_menu_item") || $(e.target).is(".btnHideColumns") || $(e.target).is(".btnShowColumns")){
                    return false;
                }
                $(".columns_selection").remove();
            });

            $(".btnHideColumns").click(function(){
                $(".selected_menu").each(function(){
                    var selected_colno = $(this).attr("data-colno");
                    $("#non-fixed-header").find(".entry-grid-header").each(function(){
                        var headno = $(this).attr("headno");
                        if(Number(selected_colno)==Number(headno)){
                            $(this).addClass("hide_column");
                        }
                    });

                    $(".entry-grid-viewport").find(".column-container").each(function(){
                        var colno = $(this).attr("col_no");
                        if(Number(selected_colno)==Number(colno)){
                            $(this).addClass("hide_column");
                        }
                    });
                });

                $(".columns_selection").remove();
            });


            $(".btnShowColumns").click(function(){
                $(".selected_menu").each(function(){
                    var selected_colno = $(this).attr("data-colno");
                    $("#non-fixed-header").find(".entry-grid-header").each(function(){
                        var headno = $(this).attr("headno");
                        if(Number(selected_colno)==Number(headno)){
                            $(this).removeClass("hide_column");
                        }
                    });

                    $(".entry-grid-viewport").find(".column-container").each(function(){
                        var colno = $(this).attr("col_no");
                        if(Number(selected_colno)==Number(colno)){
                            $(this).removeClass("hide_column");
                        }
                    });
                });

                $(".columns_selection").remove();
            });


            $(".columns_selection .eg_menu_item").click(function(){
                if(!$(this).hasClass("selected_menu")){
                    $(this).addClass("selected_menu");
                }else{
                    $(this).removeClass("selected_menu");
                }
            });


            $( ".columns_selection" ).draggable({ handle: "#title_holder" });
        }


        function update_value($rowno,$colno,$value){
            $(".entry-grid-cell").each(function(){
                var rowno = $(this).attr("rowno");
                var colno = $(this).attr("colno");
                var cell_type = $(this).attr("cell_type");
                var $value_ = $value;

                if(Number(rowno)==Number($rowno) && Number(colno)==Number($colno)){
                    if(cell_type=="numeric"){
                        $value_ = Number($value_).toFixed(2); //two decimals
                        $value = numberWithCommas($value_);
                       // $value = $value.toLocaleString();
                    }
                    $(this).attr("data-value",$value_);
                    $(this).text($value.toLocaleString());
                    return false; //break, we got one
                }
            });
        }

        function get_value($rowno,$colno){
            var $value = "";
            $(".entry-grid-cell").each(function(){
                var rowno = $(this).attr("rowno");
                var colno = $(this).attr("colno");
                if(Number(rowno)==Number($rowno) && Number(colno)==Number($colno)){
                    $value = $(this).attr("data-value");
                    return false; //break, we got one
                }
            });

            return $value;
        }

        function numberWithCommas(x){
            return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }

        function focus_on_next_control($thisObject){
            var current_column = $($thisObject).parent().attr("colno");//get the current column number
            var current_row = $($thisObject).parent().attr("rowno");//get the current row number

            //lets get next control to focus on
            $(".entry-grid-cell").each(function(i,cell){
                var rowno = $(cell).attr("rowno");
                var colno = $(cell).attr("colno");
                if(Number(rowno)==Number(current_row) && Number(colno)>Number(current_column)){
                    var readonly = $(cell).attr("readonly");
                    if(!readonly){
                        $(cell).click();
                        return false; //break, we got one
                    }
                }

            });

            settings.on_change(this);

        }

        function clear_previous_cell_control(){
            $(".input_control").each(function(i,$this){
                var readonly = $($this).attr("readonly");
                var cell_type = $($this).attr("cell_type");
                if(!readonly && (cell_type!="dropdown" && cell_type!="datepicker" && cell_type!="checkbox")){
                    var value = $($this).val();
                    if(cell_type=="numeric" && !$.isNumeric(value)){
                        value = 0;
                    }
                    $($this).parent().attr("data-value",value);
                    $($this).parent().html(value);
                }
                if(!readonly && cell_type=="dropdown"){
                    var value = $($this).val();
                    $($this).parent().attr("data-value",value);
                    $($this).parent().html(value);
                }
                if(!readonly && cell_type=="datepicker"){
                    var value = $($this).val();
                    $($this).parent().parent().attr("data-value",value);
                    $($this).parent().parent().html(value);
                }

            });
        }

        function stop_drag(){
            document.removeEventListener('mousemove', resize_col_and_header, false);
            document.removeEventListener('mouseup', stop_drag, false);  
            document.removeEventListener('selectstart',no_select_text, false);           
        }

        function no_select_text(event){
            event.preventDefault();
        }

        function fix_column(col,colcount){
            var fixed_col_cont_inner = $("<div />"); 
            var fixed_col_cont = $("<div />"); 
            fixed_col_cont.attr({class:"fixed-column-container "+colcount});
            fixed_col_cont.css({width: $(col).width() + "px", left: col_left_position + "px", height: (cont_height-56)+"px"});

            fixed_col_cont_inner.attr({class:"fixed-column-container-inner"});
            col.appendTo(fixed_col_cont_inner);

            fixed_col_cont_inner.appendTo(fixed_col_cont);
            fixed_col_cont.appendTo(settings.container);

            col_left_position += $(col).width();

            viewport.css({left: col_left_position + "px"});
        }

        function fix_header(header){
            var header = head_cont[header];
            var fixed_header_cont = $("<div />"); 
            fixed_header_cont.attr({class:"fixed-header-container"});
            fixed_header_cont.css({width: ($(header).width() + 9) + "px", left: head_left_position + "px" });
            header.appendTo(fixed_header_cont);
            header.css({cursor: "auto"});
            fixed_header_cont.appendTo(header_row_container);

            //append empty div to fill fixed headers width in the header row container
            var empty_divs = $("<div />"); 
            empty_divs.html('&nbsp;');
            empty_divs.attr({class: "entry-grid-header-empty"});
            empty_divs.css({width: ($(header).width() + 9)+ "px"});
            //empty_divs.appendTo(empty_headers);
            empty_headers.push(empty_divs);

            head_left_position += $(header).width() + 9;
        }

        function handle_scroll(){

            var scrolled_left = $(this).scrollLeft();
            var scrolled_top = $(this).scrollTop();

            if(Number(scrolled_left)>0){
                $(".eg-header-row").css({left: (40 - Number(scrolled_left)) +"px"});

            }else{
                $(".eg-header-row").css({left: "40px"});

            }

            if(Number(scrolled_top)>0){
                $(".cell-counter-container-inner").css({top: (0 - scrolled_top) +"px"});
                $(".fixed-column-container-inner").css({top: (0 - scrolled_top) +"px"});
            }else{
                $(".cell-counter-container-inner").css({top: "0px"});
                $(".fixed-column-container-inner").css({top: "0px"});
            }

        }

        function create_headers(){
            var current_col_left = cont_left+32;
            var header_row = $("<div />");
            header_row.attr({class: "eg-header-row"});

            var non_fixed_header_cont = $("<div />");
            non_fixed_header_cont.attr({id: "non-fixed-header"});
            non_fixed_header_cont.css({display: "inline-block", width:"100%"});

            settings.headers.forEach(function(header){
                var header_elem = $("<div />"); 
                header_elem.attr({class:"entry-grid-header", headno: header_count, type: header.type});
                header_elem.html(header.name+'<span class="col-resize-handle"></span>');
                header_elem.css({width: header.width+"px"});
                header_elem.appendTo(non_fixed_header_cont);

                //create column containers
                var padding = 8 * header_count;
                col_cont[header_count] = $("<div />");
                col_cont[header_count].attr({class: "column-container "+header_count, col_no: header_count});
                col_cont[header_count].css({width: header.width+"px"});

                //format header styles and attributes based on user settings
                format_header_style(header_elem,header);

                head_cont[header_count]=header_elem;

                var inner_cont = $("<div />");
                inner_cont.attr({class: "column-container-inner"});
                $(col_cont[header_count]).append(inner_cont);

                //save list items for data type dropdown and search
                if((header.type=="dropdown" || header.type=="search") && header.list){
                    dropdown_lists[header_count]={colno: header_count, list: header.list};
                }

                header_count++;
                current_col_left+= header.width;
                container_width += header.width;

            });

            non_fixed_header_cont.appendTo(header_row);

            return header_row;
        }

        function create_cells(row,rowno){

            var cell_count = 0;

            row.forEach(function(cell){
                cell_count++;

                var cell_value = "&nbsp;", placeholder=""; 
                if(cell.value!="" && typeof cell.value!="undefined"){
                    cell_value = cell.value;
                }

                if("placeholder" in cell){
                    placeholder = cell.placeholder;
                }

                //get cell type from header settings
                var $header = head_cont[cell_count];      
                var cell_type = "text";          
                if($($header).attr("type")){
                    cell_type = $($header).attr("type");
                }

                var cell_elem = $("<div />"); 
                cell_elem.attr({class:"entry-grid-cell", colno: cell_count, rowno: rowno, cell_type: cell_type, placeholder: placeholder, "data-value": cell_value});

                if(cell_type == "checkbox"){
                    var checked = "";
                    if(Number(cell_value)==1){
                        checked = 'checked=""';
                    }
                    var input_control = $('<input type="checkbox" class="input_control eg-checkbox" cell_type="'+cell_type+'" '+checked+' />');
                    input_control.css({width:"100%", height: "90%", padding: "3px", "margin-top":"-2px", "margin-left":"-4px"});
                    input_control.appendTo(cell_elem);

                    $(input_control).change(function(){
                        if($(this).is(":checked")){
                            $(this).parent().attr("data-value","1");
                        }else{
                            $(this).parent().attr("data-value","0");
                        }
                    });

                }else{
                    cell_elem.html(cell_value);
                }

                //format cell based user attributes and style
                format_cell(cell_elem,cell_count);

                $(col_cont[cell_count]).find(".column-container-inner").append(cell_elem);

            });
           // return row_object;
           return true;
        }

        function format_header_style($header,$header_style){
            /*
            //do default alignment for numeric types
            if("type" in $header_style){
                if($header_style.type=="numeric"){
                    $($header).css({"text-align": "right"});
                }
            }
            */

            //styles and attributes is align:[right,left,center=default] , type:[search,dropdown,text, numeric, datepicker] , readonly: true or false
            if("align" in $header_style){
                $($header).css({"text-align": $header_style.align});
            }else{
                $($header).css({"text-align": "center"});
            }
            if("readonly" in $header_style){
                $($header).attr({"readonly": $header_style.readonly});
            }

            return $header; 
        }

        function format_cell($cell,$header_no){
            var $header_style = head_cont[$header_no];
            
            //do styles and attributes from header settings first
            if($($header_style).attr("type")){
                if($($header_style).attr("type")=="numeric"){
                    $($cell).css({"text-align": "right"});
                }
            }
            if($($header_style).attr("readonly")){
                $($cell).attr({"readonly": $($header_style).attr("readonly")});
                $($cell).css({"background": "#fcfcfc"});
            }
        
            return $cell;
        }

        function get_first_row(){
            first_row_object = [];
            var counter = 0;
            $(".column-container-inner").each(function(i,inner_column_container){
                counter = 0;
                $(inner_column_container).find(".entry-grid-cell").each(function(i2,cell){
                    counter++;
                    if(counter==1){
                        var colno = $(cell).attr("colno");
                        first_row_object[colno]=cell;
                        return false; //break
                    }
                });
            });

        }

        function create_new_row(type){
            if(!settings.editable){
                return;
            }
            var cell_count=0;

            if(type=="new"){
                var rowno = create_cell_counter('new')+1;
                first_row_object.forEach(function(cell){
                    cell_count++;
                    var new_cell = $(cell).clone();
                    new_cell.attr("rowno",rowno);

                    //checkbox will be shown automatically
                    if(new_cell.attr("cell_type")!="checkbox"){
                        new_cell.html("");
                    }else{
                        //add listener for checkbox click
                        $(new_cell).change(function(){
                            if($(this).children(":first-child").is(":checked")){
                                $(this).attr("data-value","1");
                            }else{
                                $(this).attr("data-value","0");
                            }
                        });                        
                    }

                    new_cell.insertBefore($(col_cont[cell_count]).find(".column-container-inner .last_row"));
                    $(new_cell).removeClass("selected-row");
                });                
                cells_on_click();

                $(".last_row").off("click");
                $(".last_row").unbind("click");
                $(".last_row").click(function(){
                    create_new_row('new');
                });

                $(".entry-grid-container").scrollTop($('.entry-grid-container')[0].scrollHeight);

            }
            if(type=="trigger"){
                var rowno = "*";
                create_cell_counter('trigger');
                first_row_object.forEach(function(cell){
                    cell_count++;
                    var new_cell = $(cell).clone();
                    new_cell.attr("rowno",rowno);
                    new_cell.addClass("last_row");
                    new_cell.html("");
                    if(cell_count==1){
                        new_cell.html('<span style="color:#999;font-weight:normal;cursor:pointer;">new*</span>');
                    }
                    $(col_cont[cell_count]).find(".column-container-inner").append(new_cell);   
                });                
                
                $(".last_row").click(function(){
                    create_new_row('new');
                });
           }

           $(".entry-grid-cell-counter").off("click");
           $(".entry-grid-cell-counter").unbind("click");
           $(".entry-grid-cell-counter").click(function(){

                if(!settings.editable){
                    return;
                }

                if(!$(this).hasClass("selected-row")){
                   $(this).addClass("selected-row");
                   update_selected_row($(this).attr("rowno"),'select');
                }else{
                   $(this).removeClass("selected-row");
                   update_selected_row($(this).attr("rowno"),'deselect');
                }

                if($(this).hasClass("last_row")){
                   $(this).removeClass("selected-row");
                }

           });

        }

        function update_selected_row($rowno,$action){
            if($rowno==undefined){
                $rowno = 1;
            }
            $(".entry-grid-cell").each(function(){
                if(Number($rowno)==Number($(this).attr("rowno"))){
                    if($action=="select"){
                        $(this).addClass("selected-row");
                    }else{
                        $(this).removeClass("selected-row");
                    }
                }
            });

        }

        function create_cell_counter(type){
            var container = $(".cell-counter-container-inner");
            var count = 0; cell_counter = "";
            $(".entry-grid-cell-counter").each(function(){
                if($(this).hasClass("last_row")){
                    return false;
                }

                count++;
                cell_counter = this;
                //$(this).attr("colno",count);
                $(this).attr("rowno",count);
                $(this).html(count);
            });

            var cell_counter_ = $(cell_counter).clone();
            if(type=="new"){
                cell_counter_.attr("rowno",count+1);
                cell_counter_.html(count+1);
                cell_counter_.insertBefore($(".cell-counter-container-inner").find(".entry-grid-cell-counter.last_row"));
                $(cell_counter_).removeClass("selected-row");
            }else{
                cell_counter_.attr("rowno","*");
                cell_counter_.addClass("last_row");
                cell_counter_.html("<b>*</b>");
                cell_counter_.appendTo(container);
            }

            return count;
        }

        function get_data_(){
            clear_previous_cell_control();
            $data_array = [];

            $(".entry-grid-cell-counter:not(.last_row)").each(function(){
                var rowno = Number($(this).attr("rowno"));
                var $row = [];

                $(".column-container").each(function(){
                    var get_column_cells = $(this).find(".column-container-inner");
                    var column_cells = get_column_cells.children('div.entry-grid-cell:not(.last_row)');
                    $(column_cells).each(function(){
                        var colno = Number($(this).attr("colno"));
                        var rowno_ = Number($(this).attr("rowno"));
                        var cell_value = $(this).attr("data-value");
                        var data_name = "";

                        if(cell_value=="&nbsp;"){
                            cell_value = "";
                        }

                        var count = 0
                        settings.headers.forEach(function(col_name){
                            count++;
                            if(count==colno){
                                data_name=col_name.name;
                            }
                        });

                        if(rowno==rowno_){
                            $row.push({data_name: data_name, data_value: cell_value});
                            return false; //break in each cell
                        }

                    });
                });

                $data_array.push($row);

            });

            return $data_array;
        }

        //==================================================
        //reserved for later use
        //==================================================
        function temp() {
         
            //support for chainable because of return command
            return this.each(function() {
                // Plugin code would go here...
                
            });

        }
         
        function showNextImage() {
         
            // Returns reference to the next image node
            var image = getNextImage();
         
            // Stuff to show the image here...
         
            // Here's the callback:
            settings.onImageShow.call( image );
        }

        //==================================================
        //end of reserved for later use
        //==================================================

    };    

 
})( jQuery );


(function($) {
    $.fn.hasVScrollBar = function() {
        return this.get(0).scrollHeight > this.height();
    }
    $.fn.hasHScrollBar = function() {
        if(isFirefox){
            return Number(this.get(0).scrollWidth) > (Number(this.width())-0);
        }else{
            return Number(this.get(0).scrollWidth) > (Number(this.width()));           
        }
    }
})(jQuery);


//=======================================================================================
//detect browser type
//=======================================================================================
// Opera 8.0+
var isOpera = (!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;

// Firefox 1.0+
var isFirefox = typeof InstallTrigger !== 'undefined';

// Safari 3.0+ "[object HTMLElementConstructor]" 
var isSafari = /constructor/i.test(window.HTMLElement) || (function (p) { return p.toString() === "[object SafariRemoteNotification]"; })(!window['safari'] || (typeof safari !== 'undefined' && safari.pushNotification));

// Internet Explorer 6-11
var isIE = /*@cc_on!@*/false || !!document.documentMode;

// Edge 20+
var isEdge = !isIE && !!window.StyleMedia;

// Chrome 1+
var isChrome = !!window.chrome && !!window.chrome.webstore;

// Blink engine detection
var isBlink = (isChrome || isOpera) && !!window.CSS;
//=======================================================================================