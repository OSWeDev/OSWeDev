let template: string = '<div style="margin: 40px; padding: 20px; background: white; text-align: justify; font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; font-size: 14px; color: #002d93;">' +
    '    <div class="logo" style="margin-bottom: 40px; text-align: center; max-width: 150px;"><img style="width: 100%;" src="%%VAR%%base_url%%%%VAR%%logo_url%%"></div>' +
    '    <div style="margin-bottom:20px;">' +
    '        <div>' +
    '            <span style="margin-right: 5px;font-weight: 700">Utilisateur : </span>' +
    '            <span>%%VAR%%user_name%%</span>' +
    '        </div>' +
    '    </div>' +
    '    <div style="margin-bottom: 10px; border: 1px solid #002d93; padding: 8px; font-weight: bold; text-align: center;">' +
    '    %%VAR%%date%% - %%VAR%%name%%' +
    '    </div>' +
    '    §§IFVAR_points_cles§§<div><label style="font-weight: bold;">Points clés</label>%%VAR%%points_cles%%</div>§§§§' +
    '    §§IFVAR_objectif_prochaine_visite§§<div><label style="font-weight: bold;">Objectif de la prochaine visite</label>%%VAR%%objectif_prochaine_visite%%</div>§§§§' +
    '    §§IFVAR_groupe_1_name§§<table class="table table-condensed table-striped groupe mb-5"><thead><tr><th class="col-md-3 empty"></th><th class="col-md-3 empty"></th><th class="col-md-3">KPI</th><th class="col-md-1">Indicateur</th><th class="col-md-3">Détails</th><th class="col-md-3">Commentaires</th><th class="col-md-3">Plan d\'action</th></tr></thead><tbody><tr><td class="text-center groupe_name" rowspan="%%VAR%%groupe_1_rowspan%%"><div class="mt-2">%%VAR%%groupe_1_name%%</div></td></tr></tbody></table>§§§§' +
    '</div>';
export default template;