function add_scroll(){
    if($("#cards").css("height").split("px")[0] > 530){
        $("#cards").css("overflow-y","scroll");
    }
    if($("#models_pricing").css("height").split("px")[0] > 330){
        $("#models_pricing").css("overflow-y","scroll");
    }
}

$(document).on("change","#model_material , #model_thickness, #model_qty_count_number",function () { 
    $("#estimate_models_btn").show();
})


//function to preview image
function preview_dxf(dxf_data){
    dxf_data.map((dxf)=> {
        var font;
        var dxf_result = dxf.dxfdata;
        var loader = new THREE.FontLoader();
        var doc = 'model_dxf_img_'+dxf.filePath;
        document.getElementById(doc).style.display = 'block';
        $('#cards figure[data-model-id="'+dxf.filePath+'"] #model_img').hide();
        loader.load( 'https://dxfkrestimator.github.io/estimatordocs/helvetiker_regular.typeface.json', function ( response ) {
            font = response;
            cadCanvas = new ThreeDxf.Viewer(dxf_result, document.getElementById(doc), 120, 120, font);
        });
    })
}


$("#uploadForm").change(function(event) {
    event.preventDefault()

    const fileInput = document.getElementById('fileInput');
    var formData = new FormData();

    for (var i = 0; i < fileInput.files.length; i++) {
        formData.append('files', fileInput.files[i]); 
    }

    $.ajax({
        type: "POST",
        url: "https://dxfkrestimator.onrender.com/upload",
        data: formData,
        contentType: false,
        processData: false,
        beforeSend: function(){
            $("#uploadForm label").hide();
            $(".spinner-grow").show();
        },
        success: function (response) {
            $("#uploadForm").hide();
            $('.container').html(response['data']);
            add_scroll();
            preview_dxf(response['dxf_data']);
        }
    });
});




//function to increase and decrease model qty
function incr_decr_qty(id,eq){
    var model_qty_count = parseInt($('#model_qty_count_number[data-model-id="'+id+'"]').val());
    if(eq == 'add'){
        model_qty_count += 1; 
    }
    if(eq == 'subtract'){
        if(model_qty_count > 1){
            model_qty_count -= 1; 
        }
    }
    $('#model_qty_count_number[data-model-id="'+id+'"]').val(model_qty_count);
    $("#estimate_models_btn").show();
}
$(document).on('click','#model_qty_count_minus_btn',function(){
    var model_id = $(this).attr('data-model-id');
    incr_decr_qty(model_id,'subtract');
    
})
$(document).on('click','#model_qty_count_plus_btn',function(){
    var model_id = $(this).attr('data-model-id');
    incr_decr_qty(model_id,'add');
    
})

//remove btn
$(document).on('click', '#remove_model_btn',function(){
    var model_id = $(this).attr('data-model-id');
    $('figure[data-model-id="'+model_id+'"]').remove();
    estimate_models();
})








    

function estimate_models(){
    var models = [];

    $("#cards figure").map((el,i)=>{
        var cards_figure_model_id = $(i).attr('data-model-id'); 
        var originalName = $("#model_name[data-model-id='"+cards_figure_model_id+"']").text();
        var filename = cards_figure_model_id;
        var material = $("#model_material[data-model-id='"+cards_figure_model_id+"']").val();
        var thickness = $("#model_thickness[data-model-id='"+cards_figure_model_id+"']").val();
        var quantity = parseInt($("#model_qty_count_number[data-model-id='"+cards_figure_model_id+"']").val());

        models.push({
            originalname: originalName,
            filename: filename,
            material: material,
            thickness: thickness,
            quantity: quantity
        })

    })
    models = JSON.stringify(models);

    $.ajax({
        type: "POST",
        url: "https://dxfkrestimator.onrender.com/estimate",
        data: models,
        dataType:"json",
        contentType: "application/json",
        beforeSend: function(response){
            $("#cards , #models_pricing").addClass('text-center');
            $("#cards").html('<div class="spinner-border text-success mt-5 mb-5" role="status" style="width:14rem;height:14rem;font-size:9rem"><span class="visually-hidden">Loading...</span></div>');
            $("#models_pricing").html('<div class="spinner-border text-success mt-5 mb-5" role="status" style="width:6rem;height:6rem;font-size:3rem"><span class="visually-hidden">Loading...</span></div>');
        },
        success: function (response) {
            $("#cards , #models_pricing").removeClass('text-center');
            $("#cards").html(response["cards"]);
            $("#models_pricing").html(response["models_pricing"]);
            $("#overview_total_qty").text(response["total_qty"]);
            $("#overview_total_discount").text(response["total_discount"]);
            $("#overview_total_price").text(response["total_price"]);
            $("#overview_total_weight").text(response["total_weight"]);
            preview_dxf(response['dxf_data']);
        }
    });
}