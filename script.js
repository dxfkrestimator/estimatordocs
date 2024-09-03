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





//////////UPDATE PRICING////////////
const MaterialTemplate = '<figure id="material" class="border-bottom py-4 d-flex gap-3" data-material-id="{%MATERIAL-ID%}">'+
'<div id="material-info" class="w-75">'+
    '<div class="d-flex flex-wrap gap-3 justify-content-between align-items-center mb-3 pe-2">'+
        '<div class="material-data">'+
            '<span>Material Name :</span> <input type="text" name="material-name" id="material-name" value="{%MATERIAL-NAME%}">'+
        '</div>'+
        '<i class="bi bi-x-lg btn fs-5 fw-bolder p-0" title="Remove Material" id="remove-material-btn"></i>'+
    '</div>'+
    '<div class="d-flex flex-wrap gap-3 justify-content-between align-items-center mb-3">'+
        '<div class="material-data">'+
            '<span>Price Per Kg (NOK) :</span> <input type="text" name="material-price" id="material-price" value="{%MATERIAL-PRICE%}">'+
        '</div>'+
        '<div class="material-data">'+
            '<span>Weight Per cm<sup>2</sup> :</span> <input type="text" step="0.000001" name="material-weight" id="material-weight" value="{%MATERIAL-WEIGHT%}">'+
        '</div>'+
    '</div>'+
'</div>'+
'</figure>';

$("#add-material-btn").click(function(){
    var repTemplate = MaterialTemplate.replace("{%MATERIAL-WEIGHT%}","");
    repTemplate = repTemplate.replace("{%MATERIAL-PRICE%}","");
    repTemplate = repTemplate.replace("{%MATERIAL-NAME%}","");
    var id = $("#materialPostForm figure:last-of-type").attr('data-material-id');
    repTemplate = repTemplate.replace("{%MATERIAL-ID%}",parseInt(id)+1);    
    $("#materialPostForm").append(repTemplate)
    add_price_scroll()    
})
function add_price_scroll(){
if($("#materialPostForm").css("height").split("px")[0] > 437){
    $("#materialPostForm").css("overflow-y","scroll");
}else{
    $("#materialPostForm").css("overflow-y","");
} 
       
}

//remove btn
$(document).on('click', '#remove-material-btn',function(){
var materialFig = $(this).parent().parent().parent();
materialFig.remove();
add_price_scroll();
})

function joinMaterialFigs(data){
    let res = "";
    for (let i = 0; i < data.length; i++) {
        let repTemplate = MaterialTemplate.replace("{%MATERIAL-NAME%}",data[i].material);
        repTemplate = repTemplate.replace("{%MATERIAL-PRICE%}",parseFloat(data[i].price_per_kg));
        repTemplate = repTemplate.replace("{%MATERIAL-WEIGHT%}",parseFloat(data[i].weight_rate));
        repTemplate = repTemplate.replace("{%MATERIAL-ID%}",i);
        res += repTemplate;
    }
    return res;
}

function fetchMaterials(){
    $.ajax({
        type: "GET",
        url: "https://dxfkrestimator.onrender.com/material",
        beforeSend:function(){
            $(".spinner-grow").show();
        },
        success: function (response) {
            const material = response.data;
            let materialFigs = joinMaterialFigs(material);
            $("#materialPostForm").html(materialFigs)
            add_price_scroll()
        },
        complete: function(){
            $(".spinner-grow").hide();
        }
    });
}


$("#material-submit-btn").click(function(){
    if(!confirm('Are you sure you want to save these materials pricing?')){return false;}
    var InputMaterialData = [];
    $("#materialPostForm figure").each(function(i, obj){
        var material_id = $(this).attr('data-material-id');
        var material_name = $("figure[data-material-id='"+material_id+"'] #material-name").val();
        var material_price = $("figure[data-material-id='"+material_id+"'] #material-price").val();
        var material_weight = $("figure[data-material-id='"+material_id+"'] #material-weight").val();
        InputMaterialData.push({
            "material": material_name,
            "price_per_kg": material_price,
            "weight_rate": material_weight   
        })
    })
    InputMaterialData = JSON.stringify(InputMaterialData);
    
    $.ajax({
        type: "POST",
        url: "https://dxfkrestimator.onrender.com/material",
        data: InputMaterialData,
        dataType:"json",
        contentType: "application/json",
        success: function (response) {
            console.log(response);
        }
    });
    
    
});
